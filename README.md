# Flipper

Create a CSS Flipping Animation based on [David Walsh's solution](https://davidwalsh.name/css-flip).

## The HTML

	<div class="flipper-board">
		<div class="flipper-tile">
			<div class="flipper-tilewrap" ontouchstart="this.classList.add('istouchdevice');this.classList.toggle('hover');">
				<div class="flipper-tilefront">
					First tile front
				</div>
				<div class="flipper-tileback">
					First tile back
				</div>
			</div>
		</div>
		<div class="flipper-tile vertical">
			<div class="flipper-tilewrap">
				<div class="flipper-tilefront">
					Another tile front
				</div>
				<div class="flipper-tileback">
					Another tile back
				</div>
			</div>
		</div>
		.
		.
		.
	</div>

## The CSS

Just include css file into your project

	<link rel="stylesheet" href="https://domain.com/assets/css/flipper.css" />

## Vertical Flip

Default animation is horizontal flip. For vertical flip add `vertical` class to your `.flipper-tile` element.

## Customize your CSS

You can add something like this to your stylesheet:

	.flipper-tile { width: 15em; height: 15em; margin: 1em; }
	.flipper-tilefront, .flipper-tileback { padding: 1em; border: 1px solid #ccc; color: #333; }
	.flipper-tilefront { background: rgba(200, 0, 0, .5); }
	.flipper-tileback { background: rgba(0, 0, 200, .5); }

## Transition duration

By default transition duration is set to 600ms. You can change this by adding this to your stylesheet (keep browser vendor prefixes):

	.flipper-tilewrap, .flipper-tilefront, .flipper-tileback { -webkit-transition: .4s; -moz-transition: .4s; -ms-transition: .4s; -o-transition: .4s; transition: .4s; }

## Demo

[http://fffilo.github.io/demo/flipper/](http://fffilo.github.io/demo/flipper/)
