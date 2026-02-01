/**
 * AIによって生成されるドット絵の構造を定義する型。
 */
export type PixelArtData = {
  pixelMap: number[][]; // ドット絵のピクセル配置 (32x32の2次元配列)
  palette: string[];      // 使用する色の配列
  description: string;    // ドット絵の説明
  svgString: string;      // プレビュー表示用のSVG文字列
};

/**
 * ドット絵の動きのパターンを定義する型。
 */
export type MovementPattern = 'walking' | 'jumping' | 'idle';
