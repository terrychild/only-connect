"use strict";

(function() {
	function shuffle(array) {
		for(var i=array.length-1; i>0; i--) {
			let rand = Math.floor(Math.random() * (i+1));
			let temp = array[rand];
			array[rand] = array[i];
			array[i] = temp;
		}
		return array;
	}

	function html(parent, tag, cssClass, content) {
		let child = parent.appendChild(document.createElement(tag));
		if(cssClass) {
			child.classList.add(...cssClass.split(" "));
		}
		if(content) {
			child.innerHTML = content;
		}
		return child;
	}

	function wall(groups) {
		const WIDTH = 4;

		// Turn the groups data into a shuffled lists of bricks
		var bricks = groups.flatMap( (group) =>
			group.clues.map( (clue) => ({
				clue: clue,
				link: group.link,
				group: WIDTH
			}))
		);
		shuffle(bricks);

		// build html
		let playarea = html(document.querySelector("body"), "div", "playarea");

		let wall = html(playarea, "div", "wall player");
		bricks.forEach(function(brick) {
			brick.cell = html(wall, "div");
			brick.html = html(brick.cell, "div", "brick");
			html(brick.html, "span", "", brick.clue);
			brick.html.addEventListener("click", function() {
				selectBrick(brick);
			});
		});
		let links;

		// sizing
		(new ResizeObserver(function() {
			wall.style.height = (wall.offsetWidth * 0.5625)+"px";
			if(links) {
				links.style.height = wall.offsetHeight+"px";
			}
			playarea.style.fontSize = (wall.offsetHeight/16)+"px";
		})).observe(wall);

		// interaction
		let locked = false;
		let group = 0;
		let selected = [];
		function selectBrick(brick) {
			if(!locked) {
				if(brick.group==WIDTH) {
					if(!selected.includes(brick)) {
						selected.push(brick);
						brick.html.classList.add("group" + group);

						if(selected.length==WIDTH) {
							locked = true;
							setTimeout(checkSelected, 350);
						}
					} else {
						selected = selected.filter(b => b!=brick);
						brick.html.classList.remove("group" + group);
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
				let unsolvedIndex = groupIndex + WIDTH;
				bricks.forEach(function(brick, index) {
					if(brick.group<group) {
						brick.newIndex = index;
					} else if(brick.group==group) {
						brick.newIndex = groupIndex++;
					} else {
						brick.newIndex = unsolvedIndex++;
					}
					brick.newTop = bricks[brick.newIndex].cell.offsetTop;
					brick.newLeft = bricks[brick.newIndex].cell.offsetLeft;
				});
				bricks.sort((a,b) => a.newIndex - b.newIndex);

				// next group
				group++;

				// is there only one group left?
				if(group == WIDTH-1) {
					bricks.forEach(function(brick) {
						if(brick.group>group) {
							brick.group = group;
							brick.html.classList.add("group" + group);
						}
					});
					group++;
				}

				// move
				bricks.forEach(function(brick) {
					brick.html.style.top = (brick.newTop - brick.cell.offsetTop)+"px";
					brick.html.style.left = (brick.newLeft - brick.cell.offsetLeft)+"px";
				});
				setTimeout(function() {
					bricks.forEach(function(brick) {
						wall.removeChild(brick.cell);
						brick.html.style.top = "0px";
						brick.html.style.left = "0px";
						wall.appendChild(brick.cell);
					});
					if(group < WIDTH) {
						locked = false;
					} else {
						win();
					}
				}, 1000);
			} else {
				// an incorrect group
				selected.forEach(function(brick) {
					brick.html.classList.remove("group" + group);
				});
				locked = false;
			}
			selected = [];
		}

		function win() {
			wall.classList.add("won");
			setTimeout(function() {
				links = html(playarea, "div", "wall links");
				bricks.filter((brick, i) => i%4==0).forEach(function(brick, i) {
					let link = html(links, "div", "link group"+i, );
					let span = html(link, "span", "hidden", "click to reveal link");
					link.addEventListener("click", function() {
						if(span.classList.contains("hidden")) {
							span.classList.remove("hidden");
							span.innerHTML=brick.link;
						}
					})
				});
				links.style.height = wall.offsetHeight+"px";
			}, 1100);
		}
	}

	function editor(groups) {
		html(document.querySelector("body"), "h1", "", "Only Connect Wall Editor");
		let wall = html(document.querySelector("body"), "div", "wall editor");

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

		let button = html(html(document.querySelector("body"), "div"), "input");
		button.type="button";
		button.value="Generate Link";

		let linkBox = html(html(document.querySelector("body"), "div"), "textarea");

		button.addEventListener("click", function() {
			try {
				// duplicate tracking
				let links = {};
				let clues = {};

				// fields to data string
				let data = groups.reduce(function(acc, group) {
					return acc + "|" + group.clues.reduce(function(acc, clue) {
						return acc + ";" + valididateInput("clue", clues, clue);
					}, valididateInput("link", links, group.link));
				}, "4");

				// turn into url
				linkBox.value =
					location.origin +
					location.pathname.replace("edit.html", "play.html") +
					"?" + btoa(data);
			} catch (e) {
				linkBox.value = "Error!\n"+ e;
			}
		});

		function valididateInput(label, dups, input) {
			let value = input.value.trim();
			if(value==="") {
				throw "Missing "+label;
			}
			if(dups[value]) {
				throw "Duplicate "+label+": "+value;
			} else {
				dups[value] = true;
			}
			if(value.match(/[|;]/)) {
				throw "Invalid character in : "+value;
			}
			return value;
		}
	}

	function getData() {
		let data = atob(location.search.substr(1));
		let groups = data.split("|");
		if(groups[0]==="4" && groups.length==5) {
			return groups.slice(1).map(function(group) {
				var clues = group.split(";");
				return {
					link: clues[0],
					clues: clues.slice(1)
				};
			});
		} else {
			return [
				{link:"",clues:["","","",""]},
				{link:"",clues:["","","",""]},
				{link:"",clues:["","","",""]},
				{link:"",clues:["","","",""]}
			];
		}
	}

	// export
	window.wall = wall;
	window.editor = editor;
	window.getData = getData;
})();