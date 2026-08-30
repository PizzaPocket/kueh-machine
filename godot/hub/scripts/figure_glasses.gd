class_name FigureGlasses
extends RefCounted

## Lensless glasses for ProceduralFigure heads. Each eye rim is an extruded
## superellipse ring with a genuinely empty center; only the bridge joins the
## two rims for now (temples/stems intentionally come later).

const FRAME_COLOR := Color(0.12, 0.09, 0.07)
const ROUND_FRAME_COLOR := Color("71655f")
const EYE_OFFSET := deg_to_rad(18.0)
const FRONT_CLEARANCE := 0.01
const RIM_WIDTH_FACTOR := 2.25  # 25% larger than the previous 1.8
const RIM_HEIGHT_FACTOR := 1.1875  # 25% larger than the previous 0.95
const FRAME_THICKNESS := 0.01
const FRAME_DEPTH := 0.012
const SHAPE_EPSILON := 3.5
const SEGMENTS := 32
const BRIDGE_SEGMENTS := 10
const BRIDGE_ARCH_HEIGHT := 0.008


## Ordered top-to-bottom, per direct instruction -- duplicated from
## hero_photo.gd's own LAPIS_COLORS (bottom-to-top there, for stacking
## SuperEgg segments upward) rather than shared, since that file is a
## standalone dev capture tool with no class_name, not something other
## scripts can reference.
## The white/cream bands here get a pandan-green tint (blended 30% toward
## the same green as LAPIS_LENS_COLORS' own green band, stepped up from an
## initial 10% that read as too subtle), per direct instruction -- kueh
## lapis's cream layer is plain, but pandan is such a defining
## lapis-adjacent flavor/color that a hint of it in the lenses reads as an
## intentional accent rather than a plain cream band.
const LAPIS_LENS_CREAM := Color("bcd3b5")
const LAPIS_LENS_COLORS := [
	Color("d6203a"), Color("2f8c46"), LAPIS_LENS_CREAM, Color("d6203a"),
	Color("2f8c46"), LAPIS_LENS_CREAM, Color("d6203a"), LAPIS_LENS_CREAM,
	Color("2f8c46"),
]
const LENS_TEXTURE_SIZE := 128
## Same "flat color bands, thin blended seam" construction as the hero
## image's own kueh lapis (see hero_photo.gd's own LAPIS_BLEND_FRACTION-era
## comments) -- a texture here instead of stacked geometry, since a lens is
## one thin flat disc, not a real 3D volume worth building out of separate
## layer segments.
const LENS_BLEND_FRACTION := 0.14
static var _lapis_lens_texture_cache: ImageTexture = null


static func add_glasses(head: MeshInstance3D, semi_axes: Vector3, round_shape: bool = false, color: Color = FRAME_COLOR) -> void:
	var eye_radius := semi_axes.x * FigureEyes.EYE_RADIUS_FACTOR
	var left_eye := SuperEgg.surface_point(semi_axes, 0.0, -EYE_OFFSET)
	var right_eye := SuperEgg.surface_point(semi_axes, 0.0, EYE_OFFSET)
	var rim_half_width := eye_radius * RIM_WIDTH_FACTOR
	var rim_half_height := rim_half_width * 0.94 if round_shape else eye_radius * FigureEyes.EYE_HEIGHT_RATIO * RIM_HEIGHT_FACTOR
	var rim_thickness := FRAME_THICKNESS * 0.62 if round_shape else FRAME_THICKNESS
	var shape_epsilon := 2.05 if round_shape else SHAPE_EPSILON
	var resolved_color := ROUND_FRAME_COLOR if round_shape else color
	# Both eyes share a Z coordinate by symmetry. Put the back face of the
	# frame one centimetre beyond the eye's surface, not its center.
	var frame_z := (left_eye.z + right_eye.z) * 0.5 + FRONT_CLEARANCE + FRAME_DEPTH * 0.5

	var glasses := Node3D.new()
	glasses.name = "Glasses"
	head.add_child(glasses)

	var material := StandardMaterial3D.new()
	material.albedo_color = resolved_color
	material.roughness = 0.55
	material.cull_mode = BaseMaterial3D.CULL_DISABLED

	var eye_centers: Array[float] = [left_eye.x, right_eye.x]
	for eye_x in eye_centers:
		var rim := MeshInstance3D.new()
		rim.mesh = _build_rim_mesh(rim_half_width, rim_half_height, rim_thickness, FRAME_DEPTH, shape_epsilon)
		rim.position = Vector3(eye_x, 0.0, frame_z)
		rim.set_surface_override_material(0, material)
		glasses.add_child(rim)

	var left_inner_x := left_eye.x + rim_half_width - rim_thickness * 0.35
	var right_inner_x := right_eye.x - rim_half_width + rim_thickness * 0.35
	var bridge := MeshInstance3D.new()
	bridge.name = "GlassesBridge"
	bridge.mesh = _build_bridge_mesh(
		left_inner_x, right_inner_x, rim_half_height * 0.12,
		BRIDGE_ARCH_HEIGHT, rim_thickness, FRAME_DEPTH
	)
	bridge.position = Vector3(0.0, 0.0, frame_z)
	bridge.set_surface_override_material(0, material)
	glasses.add_child(bridge)


## Tinted-glass "lapis" glasses, per direct instruction: no surrounding
## frame, just a flat lens per eye (a solid superellipse disc, not the ring
## add_glasses() builds) carrying the same red/white/green nine-band
## pattern as the hero landing image's own floating kueh lapis slice,
## joined by the exact same bridge construction add_glasses() already
## uses. Named "Glasses" (matching add_glasses()'s own root name) so
## figure_builder.gd's existing glasses_on_hair repositioning logic --
## which finds that node by name -- works on these too, for free.
static func add_lapis_glasses(head: MeshInstance3D, semi_axes: Vector3) -> void:
	var eye_radius := semi_axes.x * FigureEyes.EYE_RADIUS_FACTOR
	var left_eye := SuperEgg.surface_point(semi_axes, 0.0, -EYE_OFFSET)
	var right_eye := SuperEgg.surface_point(semi_axes, 0.0, EYE_OFFSET)
	# 10% wider / 25% taller than a standard rim, a further 25% on top of
	# that, then 5% smaller overall, per direct follow-up instructions.
	var lens_half_width := eye_radius * RIM_WIDTH_FACTOR * 1.1 * 1.25 * 0.95
	var lens_half_height := eye_radius * FigureEyes.EYE_HEIGHT_RATIO * RIM_HEIGHT_FACTOR * 1.25 * 1.25 * 0.95
	var frame_z := (left_eye.z + right_eye.z) * 0.5 + FRONT_CLEARANCE + FRAME_DEPTH * 0.5

	var glasses := Node3D.new()
	glasses.name = "Glasses"
	head.add_child(glasses)

	var lens_material := StandardMaterial3D.new()
	lens_material.albedo_texture = _lapis_lens_texture()
	# "some transparency... so they look like tinted glass", per direct
	# instruction -- overall alpha on top of the texture's own opaque band
	# colors, dropped from an initial 0.6 to 0.4 per direct follow-up.
	lens_material.albedo_color = Color(1, 1, 1, 0.4)
	lens_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	lens_material.roughness = 0.15
	lens_material.metallic = 0.1
	lens_material.cull_mode = BaseMaterial3D.CULL_DISABLED

	var eye_centers: Array[float] = [left_eye.x, right_eye.x]
	for eye_x in eye_centers:
		var lens := MeshInstance3D.new()
		lens.mesh = _build_lens_mesh(lens_half_width, lens_half_height, FRAME_DEPTH, SHAPE_EPSILON)
		lens.position = Vector3(eye_x, 0.0, frame_z)
		lens.set_surface_override_material(0, lens_material)
		glasses.add_child(lens)

	# The bridge itself stays a plain opaque connector (real rimless glasses
	# still have a visible bridge piece) rather than tinted like the lenses --
	# colored to match the kueh lapis's own red band, per direct instruction.
	var bridge_material := StandardMaterial3D.new()
	bridge_material.albedo_color = LAPIS_LENS_COLORS[0]
	bridge_material.roughness = 0.4
	bridge_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	var left_inner_x := left_eye.x + lens_half_width - FRAME_THICKNESS * 0.35
	var right_inner_x := right_eye.x - lens_half_width + FRAME_THICKNESS * 0.35
	var bridge := MeshInstance3D.new()
	bridge.name = "GlassesBridge"
	bridge.mesh = _build_bridge_mesh(
		left_inner_x, right_inner_x, lens_half_height * 0.12,
		BRIDGE_ARCH_HEIGHT, FRAME_THICKNESS, FRAME_DEPTH
	)
	bridge.position = Vector3(0.0, 0.0, frame_z)
	bridge.set_surface_override_material(0, bridge_material)
	glasses.add_child(bridge)


static func _lapis_lens_texture() -> ImageTexture:
	if _lapis_lens_texture_cache == null:
		_lapis_lens_texture_cache = _build_lapis_lens_texture()
	return _lapis_lens_texture_cache


static func _build_lapis_lens_texture() -> ImageTexture:
	var image := Image.create(LENS_TEXTURE_SIZE, LENS_TEXTURE_SIZE, false, Image.FORMAT_RGBA8)
	var band_count := LAPIS_LENS_COLORS.size()
	var band_h := float(LENS_TEXTURE_SIZE) / float(band_count)
	var blend := band_h * LENS_BLEND_FRACTION
	# y=0 is the image's own top row; UV.y=0 is mapped to the lens's own top
	# edge in _build_lens_mesh() below, so this loop's top-to-bottom order
	# already matches LAPIS_LENS_COLORS' own top-to-bottom order directly.
	for y in range(LENS_TEXTURE_SIZE):
		var band_f := float(y) / band_h
		var band_i := clampi(int(band_f), 0, band_count - 1)
		var within := float(y) - float(band_i) * band_h
		var color: Color = LAPIS_LENS_COLORS[band_i]
		if within < blend * 0.5 and band_i > 0:
			var t := (within + blend * 0.5) / blend
			color = LAPIS_LENS_COLORS[band_i - 1].lerp(color, t)
		elif within > band_h - blend * 0.5 and band_i + 1 < band_count:
			var t := (within - (band_h - blend * 0.5)) / blend
			color = color.lerp(LAPIS_LENS_COLORS[band_i + 1], t)
		for x in range(LENS_TEXTURE_SIZE):
			image.set_pixel(x, y, color)
	return ImageTexture.create_from_image(image)


## A filled superellipse disc (front + back faces from a center-out
## triangle fan), not the hollow ring _build_rim_mesh() builds -- this is a
## solid lens, not an empty frame. UV.y=0 at the lens's own top
## (+half_height) to 1 at the bottom (-half_height), matching
## _build_lapis_lens_texture()'s own top-to-bottom row order.
static func _build_lens_mesh(half_width: float, half_height: float, depth: float, epsilon: float) -> ArrayMesh:
	var front_z := depth * 0.5
	var back_z := -depth * 0.5
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var center_front := Vector3(0, 0, front_z)
	var center_back := Vector3(0, 0, back_z)
	for i in SEGMENTS:
		var angle_a := TAU * float(i) / float(SEGMENTS)
		var angle_b := TAU * float(i + 1) / float(SEGMENTS)
		var a := _superellipse_point(half_width, half_height, angle_a, epsilon)
		var b := _superellipse_point(half_width, half_height, angle_b, epsilon)
		var uv_center := Vector2(0.5, 0.5)
		var uv_a := Vector2(0.5 + a.x / (2.0 * half_width), 0.5 - a.y / (2.0 * half_height))
		var uv_b := Vector2(0.5 + b.x / (2.0 * half_width), 0.5 - b.y / (2.0 * half_height))
		st.set_uv(uv_center)
		st.add_vertex(center_front)
		st.set_uv(uv_a)
		st.add_vertex(Vector3(a.x, a.y, front_z))
		st.set_uv(uv_b)
		st.add_vertex(Vector3(b.x, b.y, front_z))
		st.set_uv(uv_center)
		st.add_vertex(center_back)
		st.set_uv(uv_b)
		st.add_vertex(Vector3(b.x, b.y, back_z))
		st.set_uv(uv_a)
		st.add_vertex(Vector3(a.x, a.y, back_z))
	st.generate_normals()
	return st.commit()


static func _superellipse_point(half_width: float, half_height: float, angle: float, epsilon: float) -> Vector2:
	var cosine := cos(angle)
	var sine := sin(angle)
	return Vector2(
		half_width * signf(cosine) * pow(absf(cosine), 2.0 / epsilon),
		half_height * signf(sine) * pow(absf(sine), 2.0 / epsilon)
	)


static func _add_quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3) -> void:
	st.add_vertex(a)
	st.add_vertex(b)
	st.add_vertex(c)
	st.add_vertex(a)
	st.add_vertex(c)
	st.add_vertex(d)


static func _build_rim_mesh(
	half_width: float, half_height: float, thickness: float, depth: float, epsilon: float
) -> ArrayMesh:
	var inner_half_width := maxf(half_width - thickness, thickness)
	var inner_half_height := maxf(half_height - thickness, thickness)
	var front_z := depth * 0.5
	var back_z := -depth * 0.5
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)

	for i in SEGMENTS:
		var angle_a := TAU * float(i) / float(SEGMENTS)
		var angle_b := TAU * float(i + 1) / float(SEGMENTS)
		var outer_a := _superellipse_point(half_width, half_height, angle_a, epsilon)
		var outer_b := _superellipse_point(half_width, half_height, angle_b, epsilon)
		var inner_a := _superellipse_point(inner_half_width, inner_half_height, angle_a, epsilon)
		var inner_b := _superellipse_point(inner_half_width, inner_half_height, angle_b, epsilon)
		var outer_a_front := Vector3(outer_a.x, outer_a.y, front_z)
		var outer_b_front := Vector3(outer_b.x, outer_b.y, front_z)
		var inner_a_front := Vector3(inner_a.x, inner_a.y, front_z)
		var inner_b_front := Vector3(inner_b.x, inner_b.y, front_z)
		var outer_a_back := Vector3(outer_a.x, outer_a.y, back_z)
		var outer_b_back := Vector3(outer_b.x, outer_b.y, back_z)
		var inner_a_back := Vector3(inner_a.x, inner_a.y, back_z)
		var inner_b_back := Vector3(inner_b.x, inner_b.y, back_z)

		# Front/back annuli plus the outer and inner walls make a closed frame,
		# while the center remains genuinely empty (there is no lens surface).
		_add_quad(st, outer_a_front, outer_b_front, inner_b_front, inner_a_front)
		_add_quad(st, outer_b_back, outer_a_back, inner_a_back, inner_b_back)
		_add_quad(st, outer_b_front, outer_a_front, outer_a_back, outer_b_back)
		_add_quad(st, inner_a_front, inner_b_front, inner_b_back, inner_a_back)

	st.generate_normals()
	return st.commit()


## Builds a shallow upward arch between the rims. The bridge is a closed,
## extruded ribbon rather than a scaled straight primitive, so its one-
## centimetre face-on stroke remains consistent all the way around the bend.
static func _build_bridge_mesh(
	left_x: float, right_x: float, endpoint_y: float, arch_height: float,
	thickness: float, depth: float
) -> ArrayMesh:
	var center_x := (left_x + right_x) * 0.5
	var half_span := (right_x - left_x) * 0.5
	var upper: Array[Vector2] = []
	var lower: Array[Vector2] = []
	for i in range(BRIDGE_SEGMENTS + 1):
		var u := float(i) / float(BRIDGE_SEGMENTS) * 2.0 - 1.0
		var center := Vector2(
			center_x + half_span * u,
			endpoint_y + arch_height * (1.0 - u * u)
		)
		var slope := -2.0 * arch_height * u / half_span
		var tangent := Vector2(1.0, slope).normalized()
		var normal := Vector2(-tangent.y, tangent.x)
		upper.append(center + normal * thickness * 0.5)
		lower.append(center - normal * thickness * 0.5)

	var front_z := depth * 0.5
	var back_z := -depth * 0.5
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in BRIDGE_SEGMENTS:
		var upper_a_front := Vector3(upper[i].x, upper[i].y, front_z)
		var upper_b_front := Vector3(upper[i + 1].x, upper[i + 1].y, front_z)
		var lower_a_front := Vector3(lower[i].x, lower[i].y, front_z)
		var lower_b_front := Vector3(lower[i + 1].x, lower[i + 1].y, front_z)
		var upper_a_back := Vector3(upper[i].x, upper[i].y, back_z)
		var upper_b_back := Vector3(upper[i + 1].x, upper[i + 1].y, back_z)
		var lower_a_back := Vector3(lower[i].x, lower[i].y, back_z)
		var lower_b_back := Vector3(lower[i + 1].x, lower[i + 1].y, back_z)
		_add_quad(st, upper_a_front, upper_b_front, lower_b_front, lower_a_front)
		_add_quad(st, upper_b_back, upper_a_back, lower_a_back, lower_b_back)
		_add_quad(st, upper_a_back, upper_b_back, upper_b_front, upper_a_front)
		_add_quad(st, lower_a_front, lower_b_front, lower_b_back, lower_a_back)

	# Close the two exposed ends where the bridge overlaps the rims.
	var last := BRIDGE_SEGMENTS
	_add_quad(
		st,
		Vector3(upper[0].x, upper[0].y, front_z), Vector3(lower[0].x, lower[0].y, front_z),
		Vector3(lower[0].x, lower[0].y, back_z), Vector3(upper[0].x, upper[0].y, back_z)
	)
	_add_quad(
		st,
		Vector3(lower[last].x, lower[last].y, front_z), Vector3(upper[last].x, upper[last].y, front_z),
		Vector3(upper[last].x, upper[last].y, back_z), Vector3(lower[last].x, lower[last].y, back_z)
	)
	st.generate_normals()
	return st.commit()
