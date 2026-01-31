# **App Name**: ドット絵アニメジェネレータ

## Core Features:

- Input Form: Capture user inputs for character motif, color tone, movement pattern, and additional features.
- AI Data Generation: Use Genkit to generate the pixelMap (16x16 array of color IDs), palette (color ID to HEX code mapping), and a short description of the generated dot matrix, in JSON format.
- Preview Animation: Display the generated dot matrix on a canvas and animate it based on the selected movement pattern, with a re-generation option.
- JavaScript Code Generation: Combine the generated dot matrix and the movement logic to create executable JavaScript code, available for copying, bookmarklet creation, or HTML embedding.
- Copy Minified Script: Provide a button to copy the minified JavaScript code to the clipboard for easy execution in Chrome's console.
- Bookmarklet Creation: Generate a drag-and-drop link for creating a bookmarklet, allowing users to run the animation from their browser's bookmark bar.
- HTML Embed Tag: Create a tool to generate a complete HTML embed tag (ready for blogs and websites) which displays the image inline, and which kicks off the animation once the image is clicked by the user.

## Style Guidelines:

- Primary color: Vivid blue (#29ABE2) to evoke creativity and dynamism.
- Background color: Light gray (#F0F4F8), subtly desaturated and bright, providing a clean backdrop.
- Accent color: Yellow-orange (#F9A825), analogous to blue but different enough to draw attention to important actions and interactive elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif, which gives the app a machined and modern feel.
- Simple, geometric icons that align with the functional UI design, providing intuitive visual cues.
- Clean and functional layout with a focus on usability, minimizing distractions and emphasizing the core functionality of the generator tool.
- Subtle animations on button hover and during the AI data generation process to enhance user experience.