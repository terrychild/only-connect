"use strict";

(function() {
	function html(parent, tag, cssClass) {
		let child = parent.appendChild(document.createElement(tag));
		if(cssClass) {
			child.classList.add(cssClass);
		}
		return child;
	}

	function createWall() {
		let box = html(html(document.querySelector("body"), "div", "box-16x9"), "div", "box-inner");

		let wall = html(box, "div", "wall");
		let bricks = [];
		for(let i=0; i<16; i++) {
			bricks.push(html(wall, "div"));
		}
	}

	createWall();
})();