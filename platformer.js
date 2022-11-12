import kaboom from "https://unpkg.com/kaboom/dist/kaboom.mjs";

// initialize context
kaboom({
	background: [255, 255, 255]
})
//loadSound("coin-ding", "/Mario-coin-sound.mp3")

function choice(items) { return items[Math.floor(Math.random()*items.length)]; }

var respawnPoint;
// GET LEVEL NAME
window.speedrun = false
var level = await new Promise((resolve) => {
	window.setLevelURL = (s) => {
		var x = new XMLHttpRequest()
		x.open("GET", s)
		x.addEventListener("loadend", (e) => {
			window.setLevel(e.target.responseText)
		})
		x.send()
	}
	window.uploadLevel = async (e) => {
		var f = e.files[0]
		if (f) {
			var t = await f.text()
			window.setLevel(t)
		} else {
			createCard(`You need to upload a file! <button onclick="this.parentNode.remove()">Close</button>`)
		}
	}
	window.setLevel = (s) => {
		resolve(s)
		delete window.setLevel
		delete window.setLevelURL
	}
	createCard(`Select level: <button onclick="setLevelURL('level.txt'); this.parentNode.remove();">Use default level</button><br>Or enter level URL: <input type="text"><button onclick="setLevelURL(this.previousElementSibling.value); this.parentNode.remove();">Go</button><br>Or upload a level: <input type="file"><button onclick="uploadLevel(this.previousElementSibling); this.parentNode.remove();">Upload</button><br><input type="checkbox" oninput="window.speedrun = this.checked"> Speedrun`)
})
// level
level = level.split("\n")
addLevel(level, {
	width: 32,
	height: 32,
	"=": () => [ // wall
		rect(32, 32),
		color(new Color(0, 0, 0)),
		area(),
		solid()
	],
	"^": () => [ // spike
		color(new Color(100, 100, 100)),
		area({ width: 32, height: 32 }),
		solid(),
		triangle(),
		"death"
	],
	"#": () => [ // gear
		color(new Color(100, 100, 100)),
		area({ width: 32, height: 32 }),
		solid(),
		gear(),
		"death"
	],
	"O": () => [ // respawn point
		color(new Color(200, 200, 255)),
		area({ width: 32, height: 32 }),
		respawn(),
		"respawn"
	],
	"@": () => [ // player
		{
			"name": "custom_setspawn",
			"require": ["pos"],
			add() {
				respawnPoint = [this.pos.x + 16, this.pos.y + 16]
			}
		}
	],
	"+": () => [ // next level
		color(new Color(200, 255, 200)),
		area({ width: 32, height: 32 }),
		respawn(),
		"nextlevel",
		"respawn"
	],
	"!": () => [ // enemy
		circle(16),
		color(RED),
		z(2),
		outline(2),
		area({ width: 30, height: 30}),
		body(),
		origin("center"),
		"death",
		breakWhenDestroyed(),
		destroyOnSpikes(),
		enemymovement(),
		canBounce(),
		"enemy"
	],
	"$": () => [ // coin
		color(YELLOW),
		area({ width: 32, height: 32 }),
		breakWhenDestroyed(),
		{
			"id": "custom_destroy_get_coin",
			"require": ["area"],
			add() {
				var t = this;
				this.onCollide("player", (e) => {
					destroy(t);
					// Get the coin
					coins += 1
					// ding!
					//play("coin-ding")
				})
			}
		},
		coinGraphics()
	],
	"~": () => [ // Bouncy block
		rect(32, 32),
		color(new Color(50, 50, 255)),
		area(),
		solid(),
		"bouncy"
	],
	"-": () => [ // ghost wall
		rect(32, 32),
		color(new Color(0, 0, 0)),
		area(),
		z(5)
	],
})
if (!respawnPoint) {
	var tryX = 0
	var tryY = 0
	respawnPoint = [16 + 32, (level.length - 1) * 32]
}
if (window.speedrun) {
	window.speedrun = Date.now()
	createCard("Time: <span id='insert_time'></span>")
}
// CUSTOM COMPONENTS
function breakWhenDestroyed() {
	return {
		"id": "custom_break_when_destroyed",
		"require": ["pos", "color"],
		destroy() {
			for (var z = 0; z < 25; z++) {
				((e) => {
					var m = add([
						pos(e.pos.x, e.pos.y),
						rect(16, 16),
						area(),
						color(new Color(e.color.r / 2, e.color.g / 2, e.color.b / 2)),
					])
					var v = (Math.random() - 0.6) * 10
					var to = (Math.random() - 0.5) * 5
					var ticks = Math.random() * 120
					m.onUpdate(() => {
						m.pos.x += to
						m.pos.y += v
						v += Math.random()
						ticks -= 1
						if (ticks <= 0) destroy(m)
					})
				})(this)
			}
		}
	}
}
function destroyOnSpikes() {
	return {
		"id": "custom_destroy_on_spikes",
		"require": ["pos", "area"],
		add() {
			var target = this
			this.onCollide("death", () => destroy(target))
		},
		update() {
			if (this.pos.y > (level.length + 5) * 32) {
				destroy(this)
			}
		}
	}
}
function triangle() {
	return {
		"id": "custom_graphics_triangle",
		"require": ["pos", "color", "area"],
		draw() {
			drawTriangle({
				p1: vec2(0, this.area.height),
				p2: vec2(this.area.width / 2, 0),
				p3: vec2(this.area.width, this.area.height),
				pos: vec2(0, 0),
				color: this.color,
			})
		}
	}
}
function gear() {
	return {
		"id": "custom_graphics_gear",
		"require": ["pos", "color", "area"],
		draw() {
			var padding = (this.area.width + this.area.height) / 2
			padding /= 4
			drawTriangle({
				p1: vec2(0, padding),
				p2: vec2(this.area.width / 2, this.area.height),
				p3: vec2(this.area.width, padding),
				pos: vec2(0, 0),
				color: this.color,
			})
			drawTriangle({
				p1: vec2(0, this.area.height - padding),
				p2: vec2(this.area.width / 2, 0),
				p3: vec2(this.area.width, this.area.height - padding),
				pos: vec2(0, 0),
				color: this.color,
			})
		}
	}
}
function respawn() {
	return {
		"id": "custom_graphics_respawn",
		"require": ["pos", "color", "area"],
		draw() {
			var size = (this.area.width + this.area.height) / 2
			drawCircle({
				pos: vec2(this.area.width / 2, this.area.height / 2),
				radius: size / 2,
				color: this.color
			})
			drawCircle({
				pos: vec2(this.area.width / 2, this.area.height / 2),
				radius: size / 4,
				color: new Color(this.color.r / 1.5, this.color.g / 1.5, this.color.b / 1.5)
			})
		}
	}
}
function coinGraphics() {
	return {
		"id": "custom_graphics_coin",
		"require": ["pos", "color", "area"],
		draw() {
			var size = (this.area.width + this.area.height) / 2
			drawCircle({
				pos: vec2(this.area.width / 2, this.area.height / 2),
				radius: (size / 2) + 1,
				color: new Color(0, 0, 0)
			})
			drawCircle({
				pos: vec2(this.area.width / 2, this.area.height / 2),
				radius: size / 2,
				color: this.color
			})
		}
	}
}
function enemymovement() {
	return {
		"id": "custom_enemy_movement",
		"require": ["pos", "body"],
		update() {
			if (player.pos.x < this.pos.x) this.pos.x -= 1
			else this.pos.x += 1
			var colliding = [...get("death")].some((o) => this.isColliding(o) && (!o.is("enemy")))
			if (colliding) this.destroy()
			this.move(0)
			if (player.pos.y < this.pos.y && this.isGrounded()) this.jump(this.jumpspeed)
		},
		"speed": 10,
		"jumpspeed": 600
	}
}
function canBounce() {
	var isbouncing = false
	return {
		"id": "custom_can_bounce",
		"require": ["pos", "area", "body"],
		update() {
			this.pos.y += 1
			var prevbouncing = isbouncing || false
			isbouncing = false
			var o = get("bouncy")
			for (var i = 0; i < o.length; i++) {
				if (this.isColliding(o[i])) isbouncing = true
			}
			if (isbouncing && (!prevbouncing)) this.jumpspeed *= 2
			if (prevbouncing && (!isbouncing)) this.jumpspeed /= 2
			this.pos.y -= 1
		}
	}
}

// player
var newPlayerTime = -1
onUpdate(() => {
	newPlayerTime -= 1
	if (newPlayerTime == 0) newPlayer()
	if (window.speedrun) {
		document.querySelector("#insert_time").innerText = (Date.now() - window.speedrun) / 1000
	}
	// Touches
	/*
	var pos = mousePos()
	if (pos.y < height() / 2) {
		if (player.isGrounded()) player.jump(player.jumpspeed)
	}
	if (pos.x < width() / 3) {
		player.move(-player.speed, 0)
	}
	if (pos.x > width() * (2/3)) {
		player.move(player.speed, 0)
	}
	*/
})
newPlayer();
var player = get("player")[0];
onKeyDown("a", () => {
	player.move(-player.speed, 0)
});
onKeyDown("d", () => {
	player.move(player.speed, 0)
});

onKeyDown("w", () => {
	if (player.isGrounded()) {
		player.jump(player.jumpspeed)
	} else {
		//player.pos.x += (Math.random() - 0.5) * 32
		//player.pos.y += (Math.random() - 0.5) * 32
	}
});
var already_finished = false
function newPlayer() {
	player = add([
		pos(...respawnPoint),
		circle(16),
		color(GREEN),
		z(2),
		outline(2),
		area({ width: 30, height: 30}),
		body(),
		origin("center"),
		{
			speed: 500,
			jumpspeed: 705
		},
		"player",
		breakWhenDestroyed(),
		destroyOnSpikes(),
		canBounce()
	])
	// PLAYER SETUP:
	// camera follow player
	player.onUpdate(() => {
		camPos(player.pos);
	});
	player.onDestroy(() => {
		newPlayerTime = 75
	});
	player.onCollide("respawn", (e) => {
		respawnPoint = [e.pos.x + 16, e.pos.y + 16]
	})
	player.onCollide("nextlevel", (e) => {
		if (!already_finished) {
			createCard(`You finished the level${(() => {
				if (window.speedrun) return ` in ${(Date.now() - window.speedrun) / 1000} seconds`
				else return ""
			})()}! <button onclick="this.parentNode.remove()">Close</button>`)
			already_finished = true
		}
	})
}