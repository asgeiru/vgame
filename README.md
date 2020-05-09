# Snake by Ásgeir Úlfarsson #
This is the first try of making a simple game in [Phaser](https://phaser.io/ "Phaser").

Playable version of the game is hosted [here](https://snake.urmull.com/).

I have decided to include the `dist folder` with the repo since `assets`, `index.html` and `css` all are located there. 

I followed partially (mainly the game logic, how snake is stored and drawn) [this tutorial](https://tutorialzine.com/2015/06/making-your-first-html5-game-with-phaser "tutorial") how to make snake in Phaser 2 but since I am using Phaser 3 and decided to also use [TypeScript](https://www.typescriptlang.org/ "TypeScript") I had to modify it a bit.

I also used [Phaser 3 TypeScriptProject Template](https://github.com/photonstorm/phaser3-typescript-project-template "Template") to make the setup cleaner for me.

I added elements on top of the original tutorial such as:
* making snake change color based on what food he ate
* added more food types
* locally stored highscore list
* feedback when player eats food

I had loads of fun testing this out. Hope the code is of any use for any one.

# Setup #
* Clone repo
* `npm install`
* `npm run watch` or `npm run dev` (depending if you want to watch files for changes or not)
* `npm run build` (use this to create production ready build)