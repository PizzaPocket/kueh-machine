class_name HubPalette
extends RefCounted

const WHITE := Color("ffffff")
const INK := Color("4b1734")
const PINK := Color("e8629a")
const PINK_DARK := Color("b72e68")
const PINK_SOFT := Color("f8bfd9")
const GOLD := Color("f7d774")
const GREEN := Color("8fcb5e")
const GREEN_SOFT := Color("dcf0be")
const METAL_DARK := Color("777a82")
const METAL_MID := Color("bfc3c9")
const METAL_LIGHT := Color("f4f6f8")
const TAN_SKIN := Color(0.85, 0.68, 0.52)
const FAIR_SKIN := Color("edc4a3")
const BLACK_HAIR := Color("191613")
const DARK_BROWN_HAIR := Color("76513f")
const PLAYER_HAIR := Color("a77464")
const BROWN_LEATHER := Color("b77a49")

static func material(color: Color, metallic := 0.0, roughness := 0.72) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.metallic = metallic
	mat.roughness = roughness
	return mat

## Bakes a full polka-dot pattern into one square Image, covering the whole
## 0..1 UV range a SuperEgg part's own equirectangular mapping uses (see
## super_egg.gd's own build_mesh comment) -- rather than a single small dot
## tile relying on the material sampling in repeat mode, which a runtime-
## generated ImageTexture isn't guaranteed to do. dot_count is dots-per-axis
## (so the actual dot total is dot_count^2); a mesh's own UV wrap at the
## longitude seam (u=0/1) lines up automatically since the grid is spaced by
## exact integer pixel steps across the image's own width.
static func polka_dot_texture(bg: Color, dot: Color, dot_count := 8, image_size := 128, dot_radius_px := 5.0) -> ImageTexture:
	var image := Image.create(image_size, image_size, false, Image.FORMAT_RGB8)
	image.fill(bg)
	var step := float(image_size) / float(dot_count)
	for row in dot_count:
		for col in dot_count:
			var center := Vector2((col + 0.5) * step, (row + 0.5) * step)
			var min_x := int(floor(center.x - dot_radius_px))
			var max_x := int(ceil(center.x + dot_radius_px))
			var min_y := int(floor(center.y - dot_radius_px))
			var max_y := int(ceil(center.y + dot_radius_px))
			for y in range(min_y, max_y + 1):
				for x in range(min_x, max_x + 1):
					if Vector2(x, y).distance_to(center) <= dot_radius_px:
						image.set_pixel(posmod(x, image_size), posmod(y, image_size), dot)
	return ImageTexture.create_from_image(image)
