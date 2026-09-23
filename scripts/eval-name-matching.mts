/**
 * EC サイトのゲスト注文 → 既存顧客の同定（entity resolution）の精度評価。
 *
 * 想定ユースケース:
 *   1. 既存 DB からメール完全一致のレコードを抽出（プログラム）
 *   2. 候補ペアを jev で判定（姓・名・電話・住所・生年月日）
 *   3. 同一人物なら自動マージ / 別人ならエラー / それ以外は認証画面
 *
 * 重要: **メールが一致している点は jev に伝えない**（メールの一致自体が疑わしい対象のため、
 * 判断が引きずられないように state からメールを除外する）。
 *
 * 使い方: npm run eval:name-matching
 */

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-latest';

/**
 * 確信度のしきい値は「行動のリスク」に合わせて変える（TypeSafe の Confidence ドキュメントの方針）。
 * - 自動マージは取り消しが難しいため高確信度を要求する
 * - エラー表示は安全側の行動なので、緩めでも実害が小さい
 */
const MERGE_CONFIDENCE = 0.8;
const REJECT_CONFIDENCE = 0.5;

type Expect = 'merge' | 'auth' | 'reject';

interface Customer {
  surname: string;
  given_name: string;
  phone: string;
  address: string;
  birth_date: string;
}

interface TestCase {
  id: string;
  expect: Expect;
  note: string;
  a: Customer;
  b: Customer;
}

/** jev に送る質問。state にメールは含めない。 */
const QUESTIONS = {
  identity: {
    type: 'score',
    instructions: 'Are `customer_a` and `customer_b` the same person?',
    criteria: [
      'They are different people: the identifying details disagree in ways that a variant spelling, a move, or a name change cannot explain.',
      'It is not clear whether they are the same person: some details agree and others disagree, a detail is missing, or the difference could come from a life change such as marriage or moving house. These records alone are not enough to decide.',
      'They are the same person: the details agree once kana/kanji variants, address formatting, date formats, and name changes are taken into account.',
    ],
  },
  same_surname: { type: 'noul', instructions: 'Do `customer_a` and `customer_b` state the same surname (姓), allowing for kana/kanji variants and an old surname?' },
  same_given_name: { type: 'noul', instructions: 'Do `customer_a` and `customer_b` state the same given name (名), allowing for kana/kanji variants and common spelling variants of the same reading?' },
  same_phone: { type: 'noul', instructions: 'Do `customer_a` and `customer_b` state the same phone number, allowing for hyphens, spaces, and full-width digits?' },
  same_address: { type: 'noul', instructions: 'Do `customer_a` and `customer_b` state the same address, allowing for formatting differences such as arabic numerals versus kanji numerals, block notation, and a prefecture that is omitted on one side?' },
  same_birth_date: { type: 'noul', instructions: 'Do `customer_a` and `customer_b` state the same date of birth, allowing for different date formats?' },
};

const CASES: TestCase[] = [
  // ───────── 同一人物（10件）→ 自動マージ ─────────
  {
    id: 'T01', expect: 'merge', note: '完全一致',
    a: { surname: '山田', given_name: '太郎', phone: '090-1234-5678', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
    b: { surname: '山田', given_name: '太郎', phone: '090-1234-5678', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
  },
  {
    id: 'T02', expect: 'merge', note: '電話のハイフン無し',
    a: { surname: '佐藤', given_name: '花子', phone: '080-1111-2222', address: '神奈川県横浜市西区みなとみらい3-4-5', birth_date: '1990-02-14' },
    b: { surname: '佐藤', given_name: '花子', phone: '08011112222', address: '神奈川県横浜市西区みなとみらい3-4-5', birth_date: '1990-02-14' },
  },
  {
    id: 'T03', expect: 'merge', note: '住所 算用数字→漢数字',
    a: { surname: '鈴木', given_name: '一郎', phone: '03-5555-6666', address: '東京都台東区上野5-5-5', birth_date: '1975-06-30' },
    b: { surname: '鈴木', given_name: '一郎', phone: '03-5555-6666', address: '東京都台東区上野五丁目5番5号', birth_date: '1975-06-30' },
  },
  {
    id: 'T04', expect: 'merge', note: '生年月日の形式ゆれ',
    a: { surname: '田中', given_name: '健太', phone: '092-111-2222', address: '福岡県福岡市中央区天神2-2-2', birth_date: '1995-07-07' },
    b: { surname: '田中', given_name: '健太', phone: '092-111-2222', address: '福岡県福岡市中央区天神2-2-2', birth_date: '1995年7月7日' },
  },
  {
    id: 'T05', expect: 'merge', note: '姓名のスペース差',
    a: { surname: '高橋', given_name: '直樹', phone: '048-111-2222', address: '埼玉県さいたま市大宮区桜木町1-1', birth_date: '1988-03-03' },
    b: { surname: '高橋', given_name: '直樹', phone: '048-111-2222', address: '埼玉県さいたま市大宮区桜木町1-1', birth_date: '1988-03-03' },
  },
  {
    id: 'T06', expect: 'merge', note: 'カナ登録→漢字登録',
    a: { surname: 'ヤマモト', given_name: 'ケンジ', phone: '06-6123-4567', address: '大阪府大阪市北区梅田1-1-3', birth_date: '1978-09-30' },
    b: { surname: '山本', given_name: '健司', phone: '06-6123-4567', address: '大阪府大阪市北区梅田1-1-3', birth_date: '1978-09-30' },
  },
  {
    id: 'T07', expect: 'merge', note: '全角数字の電話',
    a: { surname: '中村', given_name: '由美', phone: '０９０－３３３３－４４４４', address: '千葉県船橋市本町3-3-3', birth_date: '1992-11-25' },
    b: { surname: '中村', given_name: '由美', phone: '090-3333-4444', address: '千葉県船橋市本町3-3-3', birth_date: '1992-11-25' },
  },
  {
    id: 'T08', expect: 'merge', note: '建物名・部屋番号の表記ゆれ',
    a: { surname: '小林', given_name: '大輔', phone: '03-1234-5678', address: '東京都杉並区高円寺4-4-4 ハイツ高円寺101', birth_date: '1980-05-19' },
    b: { surname: '小林', given_name: '大輔', phone: '03-1234-5678', address: '東京都杉並区高円寺4-4-4 ハイツ高円寺 101号室', birth_date: '1980-05-19' },
  },
  {
    id: 'T09', expect: 'merge', note: '法人名の表記ゆれ（B2B ゲスト注文）',
    a: { surname: '(株)サンプル商事', given_name: '佐藤 部長', phone: '03-9999-8888', address: '東京都千代田区丸の内1-1-1', birth_date: '' },
    b: { surname: '株式会社サンプル商事', given_name: '佐藤 部長', phone: '03-9999-8888', address: '東京都千代田区丸の内一丁目1番1号', birth_date: '' },
  },
  {
    id: 'T10', expect: 'merge', note: '都道府県の省略',
    a: { surname: '伊藤', given_name: '翔太', phone: '052-777-8888', address: '東京都新宿区西新宿2-8-1', birth_date: '1993-01-08' },
    b: { surname: '伊藤', given_name: '翔太', phone: '052-777-8888', address: '新宿区西新宿2-8-1', birth_date: '1993-01-08' },
  },
  {
    // 初回の評価では「中間」とラベル付けしていたが、姓の異体字違いだけで住所・電話・生年月日が
    // すべて一致しており同一人物と確定できる。ラベル側の誤りだったため「同一」に移した。
    id: 'T11', expect: 'merge', note: '旧字体・異体字（渡辺 / 渡邊、同一人物）',
    a: { surname: '渡辺', given_name: '真理', phone: '090-7777-8888', address: '東京都世田谷区三軒茶屋2-1-5', birth_date: '1970-12-01' },
    b: { surname: '渡邊', given_name: '真理', phone: '090-7777-8888', address: '東京都世田谷区三軒茶屋2-1-5', birth_date: '1970-12-01' },
  },

  // ───────── 中間（9件）→ 認証画面 ─────────
  {
    id: 'M01', expect: 'auth', note: '婚姻による改姓',
    a: { surname: '鈴木', given_name: '花子', phone: '080-1111-2222', address: '神奈川県横浜市西区みなとみらい3-4-5', birth_date: '1990-02-14' },
    b: { surname: '佐藤', given_name: '花子', phone: '080-1111-2222', address: '神奈川県横浜市西区みなとみらい3-4-5', birth_date: '1990-02-14' },
  },
  {
    id: 'M02', expect: 'auth', note: '引っ越し＋電話番号変更',
    a: { surname: '山下', given_name: '智也', phone: '090-2222-3333', address: '東京都渋谷区道玄坂1-2-3', birth_date: '1983-08-16' },
    b: { surname: '山下', given_name: '智也', phone: '080-9876-5432', address: '大阪府大阪市中央区心斎橋筋2-3-4', birth_date: '1983-08-16' },
  },
  {
    id: 'M03', expect: 'auth', note: '家族でメール共有（親アカウントで子が注文）',
    a: { surname: '藤田', given_name: '美咲', phone: '045-111-2222', address: '神奈川県横浜市港北区日吉2-2-2', birth_date: '1985-03-21' },
    b: { surname: '藤田', given_name: '悠斗', phone: '045-111-2222', address: '神奈川県横浜市港北区日吉2-2-2', birth_date: '2012-06-05' },
  },
  {

    id: 'M05', expect: 'auth', note: '生年月日の登録ミス（日のみ違い）',
    a: { surname: '岡田', given_name: '隆', phone: '03-2222-1111', address: '東京都品川区大井町3-3-3', birth_date: '1976-10-07' },
    b: { surname: '岡田', given_name: '隆', phone: '03-2222-1111', address: '東京都品川区大井町3-3-3', birth_date: '1976-10-17' },
  },
  {
    id: 'M06', expect: 'auth', note: '住所の番地違い（2-1-5 / 2-1-15）',
    a: { surname: '松本', given_name: '晃', phone: '092-444-5555', address: '福岡県福岡市博多区博多駅前2-1-5', birth_date: '1968-04-28' },
    b: { surname: '松本', given_name: '晃', phone: '092-444-5555', address: '福岡県福岡市博多区博多駅前2-1-15', birth_date: '1968-04-28' },
  },
  {
    id: 'M07', expect: 'auth', note: '名の1字違い（大輔 / 大介）',
    a: { surname: '高橋', given_name: '大輔', phone: '048-111-2222', address: '埼玉県さいたま市大宮区桜木町1-1', birth_date: '1988-03-03' },
    b: { surname: '高橋', given_name: '大介', phone: '048-111-2222', address: '埼玉県さいたま市大宮区桜木町1-1', birth_date: '1988-03-13' },
  },
  {
    id: 'M08', expect: 'auth', note: '住所が未登録（情報不足）',
    a: { surname: '石井', given_name: '香織', phone: '090-5555-1234', address: '', birth_date: '1991-09-09' },
    b: { surname: '石井', given_name: '香織', phone: '090-5555-1234', address: '愛知県名古屋市中区栄3-3-3', birth_date: '1991-09-09' },
  },
  {
    id: 'M09', expect: 'auth', note: 'ひらがな登録＋電話変更',
    a: { surname: 'さとう', given_name: 'たろう', phone: '090-1010-2020', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
    b: { surname: '佐藤', given_name: '太郎', phone: '080-3030-4040', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
  },
  {
    id: 'M10', expect: 'auth', note: '代理注文（勤務先住所で発注）',
    a: { surname: '青木', given_name: '涼子', phone: '03-8888-7777', address: '東京都中央区日本橋1-1-1 サンプルビル10F', birth_date: '1979-02-22' },
    b: { surname: '青木', given_name: '涼子', phone: '090-6666-9999', address: '埼玉県川口市並木5-5-5', birth_date: '1979-02-22' },
  },

  // ───────── 別人（10件）→ エラー ─────────
  {
    id: 'D01', expect: 'reject', note: '同姓同名の別人（全項目が不一致）',
    a: { surname: '佐藤', given_name: '太郎', phone: '090-1234-5678', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
    b: { surname: '佐藤', given_name: '太郎', phone: '011-222-3333', address: '北海道札幌市中央区北一条西2-2-2', birth_date: '1979-11-03' },
  },
  {
    id: 'D02', expect: 'reject', note: '姓のみ一致（名・住所・電話・生年月日が全部違う）',
    a: { surname: '佐藤', given_name: '太郎', phone: '090-1234-5678', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
    b: { surname: '佐藤', given_name: '花子', phone: '011-999-8888', address: '北海道札幌市中央区北一条西9-9-9', birth_date: '1994-05-25' },
  },
  {
    id: 'D03', expect: 'reject', note: '兄弟（姓・住所・固定電話が一致、名と生年月日が違う）',
    a: { surname: '高橋', given_name: '大輔', phone: '048-111-2222', address: '埼玉県さいたま市大宮区桜木町1-1', birth_date: '1988-03-03' },
    b: { surname: '高橋', given_name: '直樹', phone: '048-111-2222', address: '埼玉県さいたま市大宮区桜木町1-1', birth_date: '1990-07-07' },
  },
  {
    id: 'D04', expect: 'reject', note: '生年月日のみ一致（同姓同名の別人）',
    a: { surname: '佐藤', given_name: '太郎', phone: '090-1234-5678', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
    b: { surname: '佐藤', given_name: '太郎', phone: '052-555-6666', address: '愛知県名古屋市東区泉1-1-1', birth_date: '1985-04-12' },
  },
  {
    id: 'D05', expect: 'reject', note: '全項目が無関係',
    a: { surname: '佐藤', given_name: '太郎', phone: '090-1234-5678', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
    b: { surname: '中島', given_name: '健吾', phone: '082-222-1111', address: '広島県広島市中区紙屋町2-2-2', birth_date: '1966-06-06' },
  },
  {
    id: 'D06', expect: 'reject', note: '電話番号だけ引き継がれた別人（番号の使い回し）',
    a: { surname: '吉田', given_name: '聡', phone: '090-0000-1111', address: '京都府京都市中京区河原町3-3-3', birth_date: '1987-07-17' },
    b: { surname: '森田', given_name: '圭介', phone: '090-0000-1111', address: '兵庫県神戸市中央区三宮町1-1-1', birth_date: '1996-12-24' },
  },
  {
    id: 'D07', expect: 'reject', note: '似ているが別（太郎/太朗、区も違う）',
    a: { surname: '佐藤', given_name: '太郎', phone: '090-1234-5678', address: '東京都新宿区西新宿2-8-1', birth_date: '1985-04-12' },
    b: { surname: '佐藤', given_name: '太朗', phone: '090-8765-4321', address: '東京都中野区中野5-5-5', birth_date: '1989-09-19' },
  },
  {
    id: 'D08', expect: 'reject', note: 'シェアハウス（住所のみ一致、他は全部違う）',
    a: { surname: '佐藤', given_name: '太郎', phone: '090-1234-5678', address: '東京都世田谷区下北沢1-1-1 シェアハウスA', birth_date: '1985-04-12' },
    b: { surname: 'レイノルズ', given_name: 'アリス', phone: '080-5555-6666', address: '東京都世田谷区下北沢1-1-1 シェアハウスA', birth_date: '1997-04-01' },
  },
  {
    id: 'D09', expect: 'reject', note: '法人と、その社名を使った個人',
    a: { surname: '株式会社サンプル商事', given_name: '佐藤 部長', phone: '03-9999-8888', address: '東京都千代田区丸の内1-1-1', birth_date: '' },
    b: { surname: 'サンプル商事', given_name: '佐藤 一郎', phone: '090-1212-3434', address: '千葉県市川市八幡2-2-2', birth_date: '1982-02-02' },
  },
  {
    id: 'D10', expect: 'reject', note: '同姓同名の親子（姓・住所・電話が一致、生年月日が20年違い）',
    a: { surname: '井上', given_name: '浩', phone: '03-4444-5555', address: '東京都練馬区光が丘4-4-4', birth_date: '1960-01-01' },
    b: { surname: '井上', given_name: '浩', phone: '03-4444-5555', address: '東京都練馬区光が丘4-4-4', birth_date: '1988-01-01' },
  },
];

type Route = 'merge' | 'auth' | 'reject';

/** レベル（0=別人 / 1=不明 / 2=同一）を最近傍に丸めて行動へ写像する。 */
function routeBasic(score: number): Route {
  if (score >= 1.5) return 'merge';
  if (score <= 0.5) return 'reject';
  return 'auth';
}

/** 確信度が一律で低い場合は自動判定をせず認証画面に倒す（比較用）。 */
function routeFlatGate(score: number, confidence: number): Route {
  if (confidence < MERGE_CONFIDENCE) return 'auth';
  return routeBasic(score);
}

/**
 * 推奨ポリシー: 行動ごとに確信度の要求を変える。
 * 自動マージは高確信度のときだけ行い、エラー表示は安全側なので緩めでよい。
 */
function routeRecommended(score: number, confidence: number): Route {
  if (score >= 1.5) return confidence >= MERGE_CONFIDENCE ? 'merge' : 'auth';
  if (score <= 0.5) return confidence >= REJECT_CONFIDENCE ? 'reject' : 'auth';
  return 'auth';
}

interface Answer {
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
}

interface Result {
  testCase: TestCase;
  identity: Answer;
  nouls: Record<string, number>;
  inputTokens: number;
  failed: boolean;
}

async function judge(testCase: TestCase): Promise<Result> {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) throw new Error('TYPESAFE_API_KEY is not set');

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state: { customer_a: testCase.a, customer_b: testCase.b },
      model: MODEL,
      questions: QUESTIONS,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as {
    answers: Record<string, { type: string; score?: number; confidence?: number; probabilities?: Record<string, number>; noul?: number }>;
    usage: { input_tokens: number };
  };

  const nouls: Record<string, number> = {};
  for (const id of ['same_surname', 'same_given_name', 'same_phone', 'same_address', 'same_birth_date']) {
    nouls[id] = json.answers[id]?.noul ?? 0;
  }

  return {
    testCase,
    identity: {
      score: json.answers.identity?.score ?? 1,
      confidence: json.answers.identity?.confidence ?? 0,
      probabilities: json.answers.identity?.probabilities ?? {},
    },
    nouls,
    inputTokens: json.usage?.input_tokens ?? 0,
    failed: false,
  };
}

async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    })
  );
  return results;
}

const ICON: Record<Route, string> = { merge: '① 自動マージ', auth: '③ 認証画面  ', reject: '② エラー    ' };
const EXPECT_LABEL: Record<Expect, string> = { merge: '同一', auth: '中間', reject: '別人' };

async function main() {
  console.log(`${CASES.length} 件を評価します...\n`);
  const results = await mapWithConcurrency(CASES, 4, judge);

  console.log('id  期待  実測ルート     score  conf   姓    名    電話  住所  生年  備考');
  for (const r of results) {
    const route = routeBasic(r.identity.score);
    const danger = route === 'merge' && r.testCase.expect !== 'merge';
    const rejected = route === 'reject' && r.testCase.expect === 'merge';
    const mark = danger ? '!!' : rejected ? '! ' : '  ';
    const n = r.nouls;
    console.log(
      `${mark}${r.testCase.id} ${EXPECT_LABEL[r.testCase.expect]}  ${ICON[route]}  ` +
        `${r.identity.score.toFixed(2)}  ${r.identity.confidence.toFixed(2)}  ` +
        `${n.same_surname.toFixed(2)} ${n.same_given_name.toFixed(2)} ${n.same_phone.toFixed(2)} ` +
        `${n.same_address.toFixed(2)} ${n.same_birth_date.toFixed(2)}  ${r.testCase.note}`
    );
  }

  const POLICIES: readonly [string, (r: Result) => Route][] = [
    ['レベル丸めのみ', (r) => routeBasic(r.identity.score)],
    ['一律の確信度ゲート 0.8', (r) => routeFlatGate(r.identity.score, r.identity.confidence)],
    ['推奨: 行動別ゲート（マージ0.8 / エラー0.5）', (r) => routeRecommended(r.identity.score, r.identity.confidence)],
  ];

  for (const [label, routeFn] of POLICIES) {
    let danger = 0;
    let rejected = 0;
    let toAuth = 0;
    let exact = 0;
    const dangerCases: string[] = [];
    for (const r of results) {
      const route = routeFn(r);
      if (route === r.testCase.expect) exact += 1;
      if (route === 'merge' && r.testCase.expect !== 'merge') {
        danger += 1;
        dangerCases.push(`${r.testCase.id}(${r.identity.score.toFixed(2)}/${r.identity.confidence.toFixed(2)})`);
      }
      if (route === 'reject' && r.testCase.expect === 'merge') rejected += 1;
      if (route === 'auth' && r.testCase.expect !== 'auth') toAuth += 1;
    }
    console.log(`\n【${label}】`);
    console.log(`  期待どおり                          ${exact}/${results.length}`);
    console.log(`  危険な誤り(除外すべきペアを自動マージ) ${danger}  ← 0 必須  ${dangerCases.join(' ')}`);
    console.log(`  正規客の締め出し(同一人物をエラー)     ${rejected}`);
    console.log(`  安全側で認証画面に倒れた件数           ${toAuth}`);
  }

  const tokens = results.reduce((sum, r) => sum + r.inputTokens, 0);

  // ─── 新設計（リピータフラグのみ・スルー方式）の指標 ───
  // 顧客マスタもマージも持たず、既存注文に「リピータ」フラグを立てるかどうかだけを決める。
  // フラグを立てない場合は新規ゲスト注文としてそのまま通す（エラーも認証画面も出さない）。
  const flagged = (r: Result) => r.identity.score >= 1.5 && r.identity.confidence >= MERGE_CONFIDENCE;
  const wantFlag = (c: TestCase) => c.expect === 'merge';

  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  const fpCases: string[] = [];
  const fnCases: string[] = [];
  for (const r of results) {
    if (wantFlag(r.testCase)) {
      if (flagged(r)) tp += 1;
      else {
        fn += 1;
        fnCases.push(`${r.testCase.id}(${r.identity.score.toFixed(2)}/${r.identity.confidence.toFixed(2)})`);
      }
    } else if (flagged(r)) {
      fp += 1;
      fpCases.push(`${r.testCase.id}(${r.identity.score.toFixed(2)}/${r.identity.confidence.toFixed(2)})`);
    } else {
      tn += 1;
    }
  }

  console.log('\n【新設計: リピータフラグのみ（フラグ or スルー）】');
  console.log(`  正しくフラグ   ${tp}`);
  console.log(`  誤フラグ (FP)  ${fp}   ${fpCases.join(' ')}`);
  console.log(`  取りこぼし(FN) ${fn}   ${fnCases.join(' ')}`);
  console.log(`  正しくスルー   ${tn}`);
  if (tp + fp > 0) console.log(`  適合率 ${((tp / (tp + fp)) * 100).toFixed(0)}% / 再現率 ${((tp / (tp + fn)) * 100).toFixed(0)}%`);

  console.log(`\n入力トークン合計 ${tokens}（1ペア平均 ${Math.round(tokens / results.length)}）`);
}

await main();
