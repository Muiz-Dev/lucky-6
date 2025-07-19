# **App Name**: Lucky Six

## Core Features:

- Number Generation: Generate six random numbers between 1 and 99 every minute. Those numbers will determine what shows in the colored balls.
- Ball Display: Display the numbers as distinct colored balls with a glossy, realistic appearance, in a horizontal layout.
- Ball Coloring: Color the balls randomly with the chosen set of recurring colors (red, blue, and green).
- Draw ID Generation: Create a unique draw ID for each generated set of numbers. Keep track of the ID for historical views.
- Responsive Design: The page adapts smoothly to different screen sizes, maintaining a consistent look and feel on desktops and mobile devices. Rely heavily on viewport-based sizing, to adjust quickly and correctly to multiple display sizes.

## Style Guidelines:

- Background: Dark charcoal grey (#121212) to provide high contrast.
- Primary: Blue (#39A7FF) as the most frequently occurring ball color, aiming to evoke a feeling of serenity.
- Accent: Green (#68FF39) for infrequent winning balls; use yellow-orange for any text needing to be readable, and/or emphasis.
- Font: 'Space Grotesk' (sans-serif) for a techy and modern feel.
- Arrange the balls horizontally with a subtle gradient background to simulate depth. Display the draw ID below the balls.
- Use subtle fade-in animations as the new numbers are generated and displayed, without relying on framer-motion if it creates conflicts.