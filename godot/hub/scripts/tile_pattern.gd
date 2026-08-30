class_name TilePattern
extends RefCounted

## Ports the Peranakan tile generator built for Ken's project
## (machines/ken/backdoor/tile-row.html) from its original SVG/JS form into
## a GDScript rasterizer, for the five-foot-way's floor texture. The source
## generator draws vector paths (cubic beziers for petals, plain polygons
## for diamonds); this samples the same curves into polygons and fills them
## into an Image pixel buffer instead, since there's no runtime SVG renderer
## here. Coordinates, control-point ratios, and palette values below are
## taken directly from that source, not re-derived.

const TILE_PX := 120
const PETAL_SEGMENTS := 16

static func _cubic_bezier(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: float) -> Vector2:
	var mt := 1.0 - t
	return p0 * (mt * mt * mt) + p1 * (3.0 * mt * mt * t) + p2 * (3.0 * mt * t * t) + p3 * (t * t * t)

## Same construction as the source's petal(cx,cy,angleDeg,len,width): two
## mirrored cubic-Bezier bulges from the center to a point tip, closed back
## to the center -- the only curve primitive the source uses for every
## flower/scroll motif.
static func _petal_polygon(cx: float, cy: float, angle_deg: float, length: float, width: float) -> PackedVector2Array:
	var rad := deg_to_rad(angle_deg)
	var dir := Vector2(sin(rad), -cos(rad))
	var perp := Vector2(-dir.y, dir.x)
	var center := Vector2(cx, cy)
	var tip := center + dir * length
	var c1 := center + perp * width + dir * length * 0.32
	var c2 := center + perp * width * 0.65 + dir * length * 0.82
	var c3 := center - perp * width * 0.65 + dir * length * 0.82
	var c4 := center - perp * width + dir * length * 0.32
	var points := PackedVector2Array()
	for i in range(PETAL_SEGMENTS + 1):
		points.append(_cubic_bezier(center, c1, c2, tip, float(i) / PETAL_SEGMENTS))
	for i in range(1, PETAL_SEGMENTS + 1):
		points.append(_cubic_bezier(tip, c3, c4, center, float(i) / PETAL_SEGMENTS))
	return points

static func _diamond_polygon(cx: float, cy: float, r: float) -> PackedVector2Array:
	return PackedVector2Array([Vector2(cx, cy - r), Vector2(cx + r, cy), Vector2(cx, cy + r), Vector2(cx - r, cy)])

static func _rect_polygon(x: float, y: float, width: float, height: float) -> PackedVector2Array:
	return PackedVector2Array([Vector2(x, y), Vector2(x + width, y), Vector2(x + width, y + height), Vector2(x, y + height)])

## Alpha-aware pixel blend -- the source's semi-transparent inner diamond
## and inset border both rely on compositing over what's already drawn,
## which Image.set_pixel doesn't do on its own.
static func _blend_pixel(image: Image, x: int, y: int, color: Color) -> void:
	if x < 0 or y < 0 or x >= image.get_width() or y >= image.get_height():
		return
	if color.a >= 1.0:
		image.set_pixel(x, y, color)
	else:
		image.set_pixel(x, y, image.get_pixel(x, y).lerp(color, color.a))

## Even-odd scanline polygon fill.
static func _fill_polygon(image: Image, points: PackedVector2Array, color: Color) -> void:
	if points.size() < 3:
		return
	var min_y := points[0].y
	var max_y := points[0].y
	for p in points:
		min_y = minf(min_y, p.y)
		max_y = maxf(max_y, p.y)
	var y0 := maxi(0, int(floor(min_y)))
	var y1 := mini(image.get_height() - 1, int(ceil(max_y)))
	var n := points.size()
	for y in range(y0, y1 + 1):
		var yf := float(y) + 0.5
		var xs: Array[float] = []
		for i in range(n):
			var a := points[i]
			var b := points[(i + 1) % n]
			if (a.y <= yf and b.y > yf) or (b.y <= yf and a.y > yf):
				xs.append(a.x + (yf - a.y) / (b.y - a.y) * (b.x - a.x))
		xs.sort()
		var i := 0
		while i + 1 < xs.size():
			var x0 := maxi(0, int(round(xs[i])))
			var x1 := mini(image.get_width() - 1, int(round(xs[i + 1])))
			for x in range(x0, x1 + 1):
				_blend_pixel(image, x, y, color)
			i += 2

static func _fill_ellipse(image: Image, center: Vector2, rx: float, ry: float, color: Color) -> void:
	var x0 := maxi(0, int(floor(center.x - rx)))
	var x1 := mini(image.get_width() - 1, int(ceil(center.x + rx)))
	var y0 := maxi(0, int(floor(center.y - ry)))
	var y1 := mini(image.get_height() - 1, int(ceil(center.y + ry)))
	for y in range(y0, y1 + 1):
		for x in range(x0, x1 + 1):
			var dx := (float(x) - center.x) / rx
			var dy := (float(y) - center.y) / ry
			if dx * dx + dy * dy <= 1.0:
				_blend_pixel(image, x, y, color)

static func _stroke_rect(image: Image, size: float, thickness: float, color: Color) -> void:
	var inset := 1.0
	var span := size - inset * 2.0
	for y in range(int(inset), int(inset + thickness)):
		for x in range(int(inset), int(inset + span)):
			_blend_pixel(image, x, y, color)
			_blend_pixel(image, x, int(size - inset - 1) - (y - int(inset)), color)
	for x in range(int(inset), int(inset + thickness)):
		for y in range(int(inset), int(inset + span)):
			_blend_pixel(image, x, y, color)
			_blend_pixel(image, int(size - inset - 1) - (x - int(inset)), y, color)

## Same construction as the source's medallionQuatrefoil(mA, mB): a ring of
## 4 petals at 0/90/180/270 degrees, plus two nested center circles.
static func _quatrefoil_medallion(image: Image, cx: float, cy: float, color_a: Color, color_b: Color) -> void:
	for i in range(4):
		_fill_polygon(image, _petal_polygon(cx, cy, float(i) * 90.0, 23.0, 13.0), color_a)
	_fill_ellipse(image, Vector2(cx, cy), 9.0, 9.0, color_a)
	_fill_ellipse(image, Vector2(cx, cy), 4.0, 4.0, color_b)

## The source generator's alternate starburst medallion: a cardinal layer
## of broad petals crossed by a tighter diagonal layer. This gives the
## second two-shop pavement run a genuinely different generated motif,
## rather than merely recoloring the first tile.
static func _starburst_medallion(image: Image, cx: float, cy: float, color_a: Color, color_b: Color) -> void:
	for i in range(4):
		_fill_polygon(image, _petal_polygon(cx, cy, float(i) * 90.0, 22.0, 12.0), color_a)
	for i in range(4):
		_fill_polygon(image, _petal_polygon(cx, cy, 45.0 + float(i) * 90.0, 19.0, 9.0), color_b)
	_fill_ellipse(image, Vector2(cx, cy), 8.0, 8.0, color_a)
	_fill_ellipse(image, Vector2(cx, cy), 4.0, 4.0, color_b)

## The generator's pommee-cross tile has a broad scalloped field and blunt,
## circular-ended cross instead of a floral medallion inside a diamond.
## Keeping its composition intact makes the second pavement unmistakably
## different from the first even when viewed at a shallow camera angle.
static func _pommee_cross_medallion(image: Image, color_a: Color, color_b: Color) -> void:
	var clover_color := Color("fbf6ec")
	for center in [Vector2(60, 30), Vector2(90, 60), Vector2(60, 90), Vector2(30, 60)]:
		_fill_ellipse(image, center, 26.0, 26.0, clover_color)
	_fill_polygon(image, _rect_polygon(54, 24, 12, 72), color_a)
	_fill_polygon(image, _rect_polygon(24, 54, 72, 12), color_a)
	_fill_ellipse(image, Vector2(60, 24), 6.0, 6.0, color_a)
	_fill_ellipse(image, Vector2(60, 96), 6.0, 6.0, color_a)
	_fill_ellipse(image, Vector2(24, 60), 6.0, 6.0, color_a)
	_fill_ellipse(image, Vector2(96, 60), 6.0, 6.0, color_a)
	_fill_ellipse(image, Vector2(60, 60), 8.0, 8.0, color_a)
	for center in [Vector2(60, 26), Vector2(60, 94), Vector2(26, 60), Vector2(94, 60)]:
		_fill_ellipse(image, center, 4.0, 4.0, color_b)
	_fill_ellipse(image, Vector2(60, 60), 3.0, 3.0, color_b)

## Same construction as the source's "doubleDiamond" frame style: outer
## diamond in the frame color, a middle diamond punched back to the
## background color, and a semi-transparent inner diamond.
static func _double_diamond_frame(image: Image, size: float, frame_color: Color, bg_color: Color) -> void:
	var c := size * 0.5
	_fill_polygon(image, _diamond_polygon(c, c, size * 0.4917), frame_color)
	_fill_polygon(image, _diamond_polygon(c, c, size * 0.3667), bg_color)
	var inner := frame_color
	inner.a = 0.55
	_fill_polygon(image, _diamond_polygon(c, c, size * 0.2667), inner)

## Same construction as the source's cornerRosette(cx,cy,mA,mB): a
## background disc, a ring of 8 comma-shaped petals, and a small center dot.
## Meant to be drawn once per tile corner -- see generate_corner_drop_tile()
## for why only a quarter of it is ever visible in a single tile.
static func _corner_rosette(image: Image, cx: float, cy: float, color_a: Color, color_b: Color) -> void:
	_fill_ellipse(image, Vector2(cx, cy), 27.0, 27.0, color_b)
	for i in range(8):
		_fill_polygon(image, _petal_polygon(cx, cy, float(i) * 45.0, 14.0 * 1.15, 6.0 * 1.15), color_a)
	_fill_ellipse(image, Vector2(cx, cy), 9.0, 9.0, color_a)
	_fill_ellipse(image, Vector2(cx, cy), 4.0, 4.0, color_b)

## A single straight stroke of the given thickness, built as a thin filled
## quad rather than a true line primitive -- there's no stroked-line drawing
## call on Image, only polygon fills.
static func _stroke_segment(image: Image, from: Vector2, to: Vector2, thickness: float, color: Color) -> void:
	var dir := (to - from).normalized()
	var perp := Vector2(-dir.y, dir.x) * (thickness * 0.5)
	_fill_polygon(image, PackedVector2Array([from + perp, to + perp, to - perp, from - perp]), color)

## Ports the source's generateCornerDropTile(p): a second tile *composition*,
## not just a new motif -- its medallions sit on the tile's four corners
## instead of its center. Each corner only ever shows its own quarter of a
## rosette (the rest falls outside this TILE_PXxTILE_PX canvas and is simply
## never drawn), but four tiles repeating edge-to-edge each contribute their
## matching quarter, and together they reconstruct one whole rosette
## straddling the grout line where the tiles meet -- the same trick real
## tile sets use. `palette` needs the extra "corner" key (the small
## edge-midpoint dots) alongside the five generate_tile() already uses.
static func generate_corner_drop_tile(palette: Dictionary) -> ImageTexture:
	var image := Image.create(TILE_PX, TILE_PX, false, Image.FORMAT_RGBA8)
	image.fill(palette["bg"])
	var frame: Color = palette["frame"]
	frame.a = 0.6
	var size := float(TILE_PX)
	_stroke_segment(image, Vector2(0, 0), Vector2(size, size), 3.0, frame)
	_stroke_segment(image, Vector2(size, 0), Vector2(0, size), 3.0, frame)
	var line: Color = palette["line"]
	line.a = 0.5
	_stroke_rect(image, size, 1.5, line)
	for corner in [Vector2(0, 0), Vector2(size, 0), Vector2(0, size), Vector2(size, size)]:
		_corner_rosette(image, corner.x, corner.y, palette["medallion_a"], palette["medallion_b"])
	for mid in [Vector2(size * 0.5, 0), Vector2(size * 0.5, size), Vector2(0, size * 0.5), Vector2(size, size * 0.5)]:
		_fill_ellipse(image, mid, 6.0, 6.0, palette["corner"])
	return ImageTexture.create_from_image(image)

## One full tile: background, double-diamond frame, inset border, and a
## centered quatrefoil medallion -- the source's standard (non-corner-drop)
## tile composition. `palette` is one of TILE_PALETTES below.
static func generate_tile(palette: Dictionary, variant: int = 0) -> ImageTexture:
	var image := Image.create(TILE_PX, TILE_PX, false, Image.FORMAT_RGBA8)
	image.fill(palette["bg"])
	var line: Color = palette["line"]
	line.a = 0.5
	if variant % 2 == 0:
		_double_diamond_frame(image, float(TILE_PX), palette["frame"], palette["bg"])
		_quatrefoil_medallion(image, TILE_PX * 0.5, TILE_PX * 0.5, palette["medallion_a"], palette["medallion_b"])
	else:
		_pommee_cross_medallion(image, palette["medallion_a"], palette["medallion_b"])
	_stroke_rect(image, float(TILE_PX), 1.5, line)
	return ImageTexture.create_from_image(image)

## A subset of the source's 8 named palettes -- picked for the warm
## terracotta/cream Peranakan look in the reference photo, rather than
## porting all 8 (several of which, e.g. Night Market's near-black
## background, read as a nightclub floor rather than a sun-worn five-foot-way).
## Index 1 was originally the source's "Azulejo Blue" (blue/white) -- swapped
## for "Peranakan Ink" per direct instruction, and paired with the
## corner-drop composition above instead of the centered-medallion one, so
## the two runs read as genuinely different generated options rather than
## the same tile recolored. Both entries carry "corner" (the corner-drop
## composition's small edge-midpoint dots) even though only index 1
## currently uses it, so either can be passed to either generator.
## Index 1's medallion_a/line were originally the source palette's
## near-black ("1D1710") -- swapped for HubPalette.INK's own deep plum per
## direct instruction (the black read wrong against the rest of the
## walkway). Index 0's own "line" was a separate near-black
## ("2A2118", the source's own Sunset Clay border color) that follow-up
## feedback caught still sitting there -- swapped to the same plum for
## consistency between the two floors' border lines, instead of leaving one
## fixed and one not. Index 0's medallion_a ("8B3A3A", the source's own
## Sunset Clay medallion color) was a THIRD, still-remaining case of the
## same complaint -- not literally black, but dark/desaturated enough under
## the walkway's actual lighting to read as a black flower rather than a
## red one; brightened to a proper visible terracotta-red. All of the above
## ties back to the site's own established ink color, or a genuinely
## legible warm hue, instead of the source's own muddier originals.
const TILE_PALETTES := [
	{"bg": Color("F6ECD9"), "frame": Color("B4552F"), "medallion_a": Color("C1552E"), "medallion_b": Color("D9A441"), "corner": Color("3E8E7E"), "line": Color("4B1734")},
	{"bg": Color("FBF8EF"), "frame": Color("D9A441"), "medallion_a": Color("4B1734"), "medallion_b": Color("3F8F5F"), "corner": Color("C1553B"), "line": Color("4B1734")},
]
