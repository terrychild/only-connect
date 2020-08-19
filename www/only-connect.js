"use strict";

(function() {
	function shuffle(array) {
		var temp, rand;
		for(var i=array.length-1; i>=0; i--) {
			rand = Math.floor(Math.random() * (i+1));
			temp = array[rand];
			array[rand] = array[i];
			array[i] = temp;
		}
		return array;
	}

	function html(parent, tag, cssClass, content) {
		let child = parent.appendChild(document.createElement(tag));
		if(cssClass) {
			cssClass.split(" ").forEach(c => child.classList.add(c));
		}
		if(content) {
			child.innerHTML = content;
		}
		return child;
	}

	function wall(groups) {
		const WIDTH = 4;

		// Turn the groups data into a shuffled lists of bricks
		var bricks = [];
		groups.forEach(function(group) {
			group.clues.forEach(function(clue) {
				bricks.push({
					clue:clue,
					link:group.link,
					group: 99
				});
			});
		});
		shuffle(bricks);

		// build html
		let box = html(document.querySelector("body"), "div", "box-16x9");
		let wall = html(box, "div", "wall");
		bricks.forEach(function(brick) {
			brick.html = html(wall, "div", "brick");
			brick.float = html(brick.html, "div");
			html(brick.float, "span", "", brick.clue);
		});

		// add listener
		wall.addEventListener("click", function(event) {
			var el = event.target;
			while(!el.classList.contains("brick") && el!=wall) {
				el = el.parentNode;
			}
			if(el.classList.contains("brick")) {
				selectBrick(bricks.find(brick => brick.html == el));
			}
		});

		let locked = false;
		let group = 0;
		let selected = [];
		function selectBrick(brick) {
			if(!locked) {
				if(brick.group>=WIDTH && !selected.includes(brick)) {
					selected.push(brick);
					brick.html.classList.add("group" + group);

					if(selected.length==WIDTH) {
						locked = true;
						setTimeout(checkSelected, 350);
					}
				}
			}
		}

		function checkSelected() {
			let link = selected[0].link;
			if(selected.filter(brick => brick.link!=link).length==0) {
				// a correct group
				selected.forEach(function(brick) {
					brick.group = group;
				});
				// calculate new position in the grid
				let groupIndex = group * WIDTH;
				let restIndex = groupIndex + WIDTH;
				bricks.forEach(function(brick, index) {
					if(brick.group<group) {
						brick.newIndex = index;
					} else if(brick.group==group) {
						brick.newIndex = groupIndex++;
					} else {
						brick.newIndex = restIndex++;
					}
					brick.newTop = bricks[brick.newIndex].html.offsetTop;
					brick.newLeft = bricks[brick.newIndex].html.offsetLeft;
				});
				bricks.sort(function(a,b) {
					return a.newIndex - b.newIndex;
				});
				group++;
				if(group == WIDTH-1) {
					bricks.forEach(function(brick) {
						if(brick.group>group) {
							brick.group = group;
							brick.html.classList.add("group" + group);
						}
					});
				}

				// move
				bricks.forEach(function(brick) {
					brick.float.style.transitionProperty = "top, left";
					brick.float.style.top = (brick.newTop - brick.html.offsetTop)+"px";
					brick.float.style.left = (brick.newLeft - brick.html.offsetLeft)+"px";
				});
				setTimeout(function() {
					bricks.forEach(function(brick) {
						brick.float.style.transitionProperty = "none";
						brick.float.style.top = "0px";
						brick.float.style.left = "0px";
						wall.removeChild(brick.html);
					});
					bricks.forEach(function(brick) {
						wall.appendChild(brick.html);
					});
					locked = false;
				}, 1000);
			} else {
				selected.forEach(function(brick) {
					brick.html.classList.remove("group" + group);
				});
				locked = false;
			}
			selected = [];
		}
	}

	function editor(groups) {
		//const WIDTH = 4;
		//let groups = [];

		html(document.querySelector("body"), "h1", "", "Only Connect Wall Editor");
		let wall = html(document.querySelector("body"), "div", "wall-editor");

		groups = groups.map(function(group, index) {
			let clues = group.clues.map(function(clue) {
				let input = html(html(wall, "div", "brick group"+index), "input");
				input.value = clue;
				return input;
			});
			let input = html(html(wall, "div", "link group"+index), "input");
			input.placeholder="link";
			input.value = group.link;

			return {
				clues: clues,
				link: input
			}
		});

		/*for(let g=0; g<WIDTH; g++) {
			var group = {
				clues: []
			};
			for(let clue=0; clue<WIDTH; clue++) {
				group.clues.push(html(html(wall, "div", "brick group"+g), "input"));
			}
			group.link = html(html(wall, "div", "link group"+g), "input");
			group.link.placeholder="link";
			groups.push(group);
		}*/

		let button = html(html(document.querySelector("body"), "div"), "input");
		button.type="button";
		button.value="Generate Link";

		let linkBox = html(html(document.querySelector("body"), "div"), "textarea");

		button.addEventListener("click", function() {
			let json = JSON.stringify(groups, function(key, value) {
				if(value instanceof HTMLInputElement) {
					return value.value;
				}
				return value;
			});

			linkBox.value = "http://flat.moohar.com/only-connect/play.html?" + btoa(json);
		});
	}

	function getGroups() {
		let json = atob(location.search.substr(1));
		try {
			return JSON.parse(json);
		} catch {
			return [
				{clues:["","","",""], link:""},
				{clues:["","","",""], link:""},
				{clues:["","","",""], link:""},
				{clues:["","","",""], link:""}
			];
		}
	}

	// export
	window.wall = wall;
	window.editor = editor;
	window.getGroups = getGroups;
})();