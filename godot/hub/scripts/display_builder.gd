class_name DisplayBuilder
extends RefCounted

const LAPIS_LOGO: Texture2D = preload("res://assets/arcade/lapis-logo.svg")
const BAKERY_LOGO: Texture2D = preload("res://assets/arcade/kueh-bakery-logo.svg")

static func _mesh(parent: Node3D, primitive: PrimitiveMesh, color: Color, pos: Vector3, name: String, metallic := 0.0, roughness := 0.72) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = name
	node.mesh = primitive
	node.position = pos
	node.material_override = HubPalette.material(color, metallic, roughness)
	parent.add_child(node)
	return node

static func _box(parent: Node3D, size: Vector3, color: Color, pos: Vector3, name: String, metallic := 0.0) -> MeshInstance3D:
	var box := BoxMesh.new()
	box.size = size
	return _mesh(parent, box, color, pos, name, metallic, 0.32 if metallic > 0 else 0.72)

static func _sphere(parent: Node3D, scale_value: Vector3, color: Color, pos: Vector3, name: String) -> MeshInstance3D:
	var sphere := SphereMesh.new()
	sphere.radius = 0.5
	sphere.height = 1.0
	sphere.radial_segments = 18
	sphere.rings = 10
	var node := _mesh(parent, sphere, color, pos, name)
	node.scale = scale_value
	return node

## SphereMesh's own is_hemisphere flag caps the flat equator with a solid
## disc rather than leaving it open (confirmed by dumping its generated
## arrays -- a third of the triangles have all 3 vertices on that flat
## plane), which is invisible when two hemispheres are joined cap-to-cap
## (see _two_tone_capsule above) but reads as a lid when only ONE hemisphere
## is used as an open bowl/shell. This rebuilds the same mesh and strips out
## exactly those cap-plane triangles, leaving a genuinely open curved shell.
static func _open_hemisphere_mesh(radius: float, radial_segments: int, rings: int) -> ArrayMesh:
	var sphere := SphereMesh.new()
	sphere.radius = radius
	sphere.height = radius * 2.0
	sphere.is_hemisphere = true
	sphere.radial_segments = radial_segments
	sphere.rings = rings
	var source := sphere.surface_get_arrays(0)
	var verts: PackedVector3Array = source[Mesh.ARRAY_VERTEX]
	var indices: PackedInt32Array = source[Mesh.ARRAY_INDEX]
	var cap_epsilon := radius * 0.002
	var kept_indices := PackedInt32Array()
	for i in range(0, indices.size(), 3):
		var ia := indices[i]
		var ib := indices[i + 1]
		var ic := indices[i + 2]
		if absf(verts[ia].y) < cap_epsilon and absf(verts[ib].y) < cap_epsilon and absf(verts[ic].y) < cap_epsilon:
			continue
		kept_indices.append(ia)
		kept_indices.append(ib)
		kept_indices.append(ic)
	var open_arrays := []
	open_arrays.resize(Mesh.ARRAY_MAX)
	open_arrays[Mesh.ARRAY_VERTEX] = verts
	open_arrays[Mesh.ARRAY_NORMAL] = source[Mesh.ARRAY_NORMAL]
	open_arrays[Mesh.ARRAY_TEX_UV] = source[Mesh.ARRAY_TEX_UV]
	open_arrays[Mesh.ARRAY_INDEX] = kept_indices
	var open_mesh := ArrayMesh.new()
	open_mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, open_arrays)
	return open_mesh

static func _two_tone_capsule(parent: Node3D, scale_value: Vector3, lower_color: Color, pos: Vector3, capsule_name: String) -> Node3D:
	# Two true hemispheres share one equator, so the capsule reads as one ball
	# instead of a small white ball overlapping a colored one.
	var capsule := Node3D.new()
	capsule.name = capsule_name
	capsule.position = pos
	parent.add_child(capsule)
	var upper_mesh := SphereMesh.new()
	upper_mesh.radius = 0.5
	# Godot's SphereMesh requires hemisphere height to equal radius. Using the
	# full-sphere diameter here creates an elongated egg half.
	upper_mesh.height = 0.5
	upper_mesh.is_hemisphere = true
	upper_mesh.radial_segments = 18
	upper_mesh.rings = 8
	var upper := _mesh(capsule, upper_mesh, Color("fafafa"), Vector3.ZERO, "WhiteHalf")
	upper.scale = scale_value
	var lower_mesh := SphereMesh.new()
	lower_mesh.radius = 0.5
	lower_mesh.height = 0.5
	lower_mesh.is_hemisphere = true
	lower_mesh.radial_segments = 18
	lower_mesh.rings = 8
	var lower := _mesh(capsule, lower_mesh, lower_color, Vector3.ZERO, "ColoredHalf")
	lower.scale = scale_value
	lower.rotation.x = PI
	return capsule

static func _super_part(parent: Node3D, semi_axes: Vector3, color: Color, pos: Vector3, part_name: String, metallic := 0.0, roughness := 0.58) -> MeshInstance3D:
	var node := SuperEgg.build_part(semi_axes, color, SuperEgg.EPSILON_FLAT, SuperEgg.EPSILON_FLAT)
	node.name = part_name
	node.position = pos
	node.material_override = HubPalette.material(color, metallic, roughness)
	parent.add_child(node)
	return node

static func _box_collision(parent: Node3D, size: Vector3, pos: Vector3, body_name: String) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.name = body_name
	body.collision_layer = 1
	body.collision_mask = 0
	body.position = pos
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	parent.add_child(body)
	return body

static func pedestal(parent: Node3D, position: Vector3, radius := 0.68, height := 0.95) -> Node3D:
	# Keep every museum plinth unmistakably columnar. The height-based cap also
	# protects custom short plinths from becoming wider than they are tall.
	var reduced_radius: float = minf(radius * 0.50, height * 0.42)
	var root := Node3D.new()
	root.name = "PureWhitePedestal"
	root.position = position
	parent.add_child(root)
	var body := SuperEgg.build_part(
		Vector3(reduced_radius, height * 0.5, reduced_radius),
		Color.WHITE,
		SuperEgg.EPSILON_FLAT,
		SuperEgg.EPSILON_FLAT
	)
	body.name = "MuseumPlinthColumn"
	var plinth_material := HubPalette.material(Color(1.0, 1.0, 1.0, 1.0), 0.0, 0.46)
	# Use the same ordinary opaque material path as every other SuperEgg part.
	plinth_material.transparency = BaseMaterial3D.TRANSPARENCY_DISABLED
	plinth_material.depth_draw_mode = BaseMaterial3D.DEPTH_DRAW_OPAQUE_ONLY
	body.material_override = plinth_material
	body.position.y = height * 0.5
	root.add_child(body)
	var solid := StaticBody3D.new()
	solid.name = "PedestalSolidBody"
	solid.collision_layer = 1
	solid.collision_mask = 0
	var pedestal_collision := CollisionShape3D.new()
	var pedestal_shape := CylinderShape3D.new()
	pedestal_shape.radius = reduced_radius
	pedestal_shape.height = height
	pedestal_collision.shape = pedestal_shape
	pedestal_collision.position.y = height * 0.5
	solid.add_child(pedestal_collision)
	root.add_child(solid)
	return root

static func build(parent: Node3D, kind: String, position: Vector3) -> Node3D:
	match kind:
		"amy_gacha": return _amy_gacha(parent, position)
		"ken_gacha": return _ken_gacha(parent, position)
		"lapis_arcade": return _arcade(parent, position, "lapis")
		"bakery_arcade": return _arcade(parent, position, "bakery")
		"cat_scan": return _cat_station(parent, position)
		"remember": return _remember_station(parent, position)
		"amanda": return _amanda_bear(parent, position)
		"jesslyn": return _jesslyn_cake(parent, position)
		"kaixin": return _kaixin_microphone(parent, position)
		"viki": return _viki_kueh_platter(parent, position)
		"meijun": return _meijun_gas_range(parent, position)
		"nicole_calculator": return _nicole_life_calculator(parent, position)
		"water_glass": return _water_glass_station(parent, position)
		_: return _generic_station(parent, position, kind)

static func _amy_gacha(parent: Node3D, position: Vector3) -> Node3D:
	# A fully modeled interpretation of Amy's SVG: pale graphic casing, heavy
	# black edge language, bulging capsule chamber, three capsule colors,
	# Japanese marquee, asymmetric controls, and the yellow bird on top.
	var stand := pedestal(parent, position, 0.78, 0.82)
	var root := Node3D.new()
	root.name = "AmyModeledGacha"
	root.position.y = 0.82
	root.scale = Vector3.ONE * 0.35
	# HubMain applies the one required inward-facing rotation to the pedestal.
	root.rotation.y = 0.0
	stand.add_child(root)
	_box_collision(root, Vector3(1.62, 3.28, 0.84), Vector3(0, 1.63, 0), "AmyGachaSolidBody")
	var shell_color := Color("edf2ec")
	var shell_edge := Color("d9e0da")
	var ink := Color("101010")
	var coral := Color("dd7b68")
	var dusty_blue := Color("758ca3")
	var tan := Color("bca076")
	# Lower body flares gently at the shoulder just as the SVG silhouette does.
	_super_part(root, Vector3(0.78, 0.72, 0.39), shell_color, Vector3(0, 0.73, -0.01), "PaleMintLowerCabinet", 0.0, 0.48)
	_super_part(root, Vector3(0.80, 0.085, 0.42), shell_edge, Vector3(0, 1.43, 0), "PaleChamberBase")
	# In 3D, the illustration's black contour is represented by a subtle change
	# in the pale casing fill—not a dominant solid-black structural shell.
	_super_part(root, Vector3(0.81, 0.67, 0.405), shell_edge, Vector3(0, 2.02, -0.075), "PaleChamberShell", 0.0, 0.72)
	_super_part(root, Vector3(0.76, 0.62, 0.36), Color("f7f7f5"), Vector3(0, 2.02, -0.04), "ChamberBacking", 0.0, 0.82)
	var glass := _super_part(root, Vector3(0.775, 0.635, 0.38), Color.WHITE, Vector3(0, 2.02, 0), "BulgingGlassChamber", 0.0, 0.08)
	var glass_material := StandardMaterial3D.new()
	glass_material.albedo_color = Color(1, 1, 1, 0.17)
	glass_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass_material.roughness = 0.08
	glass_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	glass.material_override = glass_material
	var amy_capsules: Array[Vector3] = [
		Vector3(-0.53, 1.67, 0.34), Vector3(-0.18, 1.64, 0.37), Vector3(0.18, 1.68, 0.36), Vector3(0.53, 1.66, 0.34),
		Vector3(-0.58, 1.98, 0.33), Vector3(-0.28, 2.01, 0.37), Vector3(0.03, 1.96, 0.38), Vector3(0.34, 2.02, 0.36), Vector3(0.61, 1.96, 0.32),
		Vector3(-0.46, 2.29, 0.34), Vector3(-0.12, 2.28, 0.38), Vector3(0.23, 2.31, 0.36), Vector3(0.51, 2.27, 0.33),
	]
	var capsule_colors: Array[Color] = [tan, coral, dusty_blue]
	for index in range(amy_capsules.size()):
		var capsule_color: Color = capsule_colors[index % capsule_colors.size()]
		_two_tone_capsule(root, Vector3.ONE * 0.32, capsule_color, amy_capsules[index], "AmyTwoToneCapsule%d" % index)
	# Graphic marquee built as a deep casing with real 3D text panels.
	_super_part(root, Vector3(0.82, 0.34, 0.40), shell_edge, Vector3(0, 2.80, 0), "PaleMarqueeShell")
	_super_part(root, Vector3(0.78, 0.30, 0.38), shell_color, Vector3(0, 2.80, 0.02), "OffWhiteMarquee")
	var japanese := Label3D.new()
	japanese.name = "JapaneseGachaLettering"
	japanese.text = "ガチャ ガチャ\nクエ"
	japanese.font_size = 54
	japanese.modulate = ink
	japanese.position = Vector3(-0.18, 2.80, 0.415)
	japanese.pixel_size = 0.0048
	japanese.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(japanese)
	_super_part(root, Vector3(0.19, 0.20, 0.035), ink, Vector3(0.48, 2.80, 0.415), "AmyNamePanel")
	var amy_name := Label3D.new()
	amy_name.text = "エイ\nミー"
	amy_name.font_size = 48
	amy_name.modulate = shell_color
	amy_name.pixel_size = 0.0045
	amy_name.position = Vector3(0.48, 2.80, 0.46)
	root.add_child(amy_name)
	# Coin slot, turning knob, and prize hatch follow the SVG's asymmetric face.
	_super_part(root, Vector3(0.17, 0.07, 0.035), Color("bdbdbd"), Vector3(-0.45, 1.25, 0.405), "CoinSlotPlate", 0.15, 0.30)
	_super_part(root, Vector3(0.13, 0.03, 0.025), ink, Vector3(-0.45, 1.26, 0.45), "CoinSlot", 0.0, 0.60)
	var knob_mesh := CylinderMesh.new()
	knob_mesh.top_radius = 0.25
	knob_mesh.bottom_radius = 0.25
	knob_mesh.height = 0.13
	var knob := _mesh(root, knob_mesh, shell_color, Vector3(-0.34, 0.79, 0.43), "OutlinedTurnKnob", 0.02, 0.40)
	knob.rotation.x = PI * 0.5
	var knob_ring := TorusMesh.new()
	knob_ring.inner_radius = 0.205
	knob_ring.outer_radius = 0.255
	var ring := _mesh(root, knob_ring, ink, Vector3(-0.34, 0.79, 0.505), "BlackKnobRing")
	ring.rotation.x = PI * 0.5
	_box(root, Vector3(0.42, 0.09, 0.08), shell_color, Vector3(-0.34, 0.79, 0.53), "KnobHandle")
	_super_part(root, Vector3(0.29, 0.32, 0.12), ink, Vector3(0.39, 0.54, 0.39), "BlackPrizeHatchOutline")
	_super_part(root, Vector3(0.25, 0.28, 0.10), Color("ffffff"), Vector3(0.39, 0.55, 0.50), "WhitePrizeHatch")
	_super_part(root, Vector3(0.25, 0.065, 0.11), Color("b8b9b8"), Vector3(0.39, 0.31, 0.51), "PrizeHatchLip")
	# Interpret the drawn strokes as connected solid-yellow 3D anatomy rather
	# than separate black outline pieces.
	var bird := Node3D.new()
	bird.name = "PerchedYellowBird"
	bird.position = Vector3(0.46, 3.24, 0.03)
	root.add_child(bird)
	var bird_yellow := Color("ffdf78")
	_sphere(bird, Vector3(0.25, 0.26, 0.19), bird_yellow, Vector3.ZERO, "BirdRoundBody")
	# The visible wing sweeps backward, matching the long right-hand lobe in
	# the source drawing rather than reading as a small circular spot.
	var wing := _sphere(bird, Vector3(0.21, 0.105, 0.075), bird_yellow, Vector3(0.105, -0.015, 0.072), "BirdSweptWing")
	wing.rotation.z = deg_to_rad(-24.0)
	var beak_mesh := CylinderMesh.new()
	beak_mesh.top_radius = 0.0
	beak_mesh.bottom_radius = 0.055
	beak_mesh.height = 0.22
	beak_mesh.radial_segments = 16
	var beak := _mesh(bird, beak_mesh, Color("d7a92f"), Vector3(-0.175, 0.018, 0.025), "AttachedDarkYellowConeBeak", 0.0, 0.58)
	beak.rotation.z = PI * 0.5
	# Seat the eye into the ellipsoid's curved front at this X/Y coordinate.
	# Its former Z=0.194 sat almost a full body-depth in front of the surface.
	_sphere(bird, Vector3(0.027, 0.027, 0.020), ink, Vector3(-0.095, 0.075, 0.032), "VisibleBirdEye")
	# Each feather begins inside the crown so no component floats.
	var crest_left := _box(bird, Vector3(0.025, 0.16, 0.025), bird_yellow, Vector3(0.015, 0.195, 0.010), "LeftCrownFeather")
	crest_left.rotation.z = deg_to_rad(-18.0)
	var crest_right := _box(bird, Vector3(0.025, 0.17, 0.025), bird_yellow, Vector3(0.080, 0.198, 0.010), "RightCrownFeather")
	crest_right.rotation.z = deg_to_rad(-30.0)
	for leg_x in [-0.075, 0.075]:
		_box(bird, Vector3(0.025, 0.16, 0.025), bird_yellow, Vector3(leg_x, -0.205, 0), "BirdLeg")
		_box(bird, Vector3(0.10, 0.022, 0.030), bird_yellow, Vector3(leg_x - 0.018, -0.29, 0.020), "BirdPerchingFoot")
	return stand

static func _gacha(parent: Node3D, position: Vector3, amy: bool) -> Node3D:
	var stand := pedestal(parent, position, 1.05, 0.65)
	var root := Node3D.new()
	root.name = "AmyGacha" if amy else "KenGacha"
	root.position.y = 0.62
	stand.add_child(root)
	var body_color := Color("93b8df") if amy else Color("342f2d")
	var accent := Color("d94848") if amy else Color("e4a93b")
	var body := MeshInstance3D.new()
	body.mesh = Superegg.mesh(0.68, 1.38, 3.4)
	body.material_override = HubPalette.material(body_color, 0.08, 0.46)
	body.position.y = 0.82
	root.add_child(body)
	_sphere(root, Vector3(0.48, 0.44, 0.18), Color("dceaf4") if amy else Color("f4dfae"), Vector3(0, 1.03, 0.58), "CapsuleWindow")
	for i in range(5):
		var a := i * 1.9
		_sphere(root, Vector3(0.11, 0.11, 0.08), [HubPalette.PINK, HubPalette.GREEN, HubPalette.GOLD][i % 3], Vector3(cos(a) * 0.3, 1.04 + sin(a) * 0.22, 0.7), "Capsule")
	var knob := CylinderMesh.new()
	knob.top_radius = 0.15
	knob.bottom_radius = 0.15
	knob.height = 0.22
	var knob_node := _mesh(root, knob, accent, Vector3(0, 0.54, 0.7), "Knob", 0.12)
	knob_node.rotation.x = PI * 0.5
	_box(root, Vector3(0.5, 0.12, 0.18), accent, Vector3(0, 0.26, 0.62), "PrizeChute")
	return stand

static func _ken_gacha(parent: Node3D, position: Vector3) -> Node3D:
	# Ken's machine follows the supplied reference: a tall, square capsule
	# chamber over a cream control cabinet, with lacquer-red framing, deep-blue
	# hardware, and gold-on-blue ornamental corner panels. Superegg shells keep
	# the silhouette consistent with the rest of the hub without genericising it.
	var stand := pedestal(parent, position, 0.78, 0.82)
	var root := Node3D.new()
	root.name = "KenReferenceGacha"
	root.position.y = 0.82
	root.scale = Vector3.ONE * 0.35
	root.rotation.y = 0.0
	stand.add_child(root)
	_box_collision(root, Vector3(1.48, 3.02, 0.92), Vector3(0, 1.50, 0), "KenGachaSolidBody")
	var cream := Color("f3e4c5")
	var red := Color("d52a1e")
	var blue := Color("075071")
	var gold := Color("e5a932")
	var dark := Color("102c35")

	# Lower cabinet and blue plinth.
	_super_part(root, Vector3(0.78, 0.73, 0.42), cream, Vector3(0, 0.78, 0), "CreamControlCabinet", 0.0, 0.34)
	_super_part(root, Vector3(0.80, 0.10, 0.44), blue, Vector3(0, 0.10, 0), "BlueBaseRail", 0.08, 0.28)
	for x in [-0.59, 0.59]:
		_super_part(root, Vector3(0.13, 0.08, 0.16), Color("242424"), Vector3(x, 0.02, 0.0), "Caster", 0.0, 0.44)

	# Transparent chamber, backed subtly so the red-and-white capsules remain legible.
	_super_part(root, Vector3(0.76, 0.62, 0.40), Color("48241f"), Vector3(0, 2.03, -0.035), "ChamberBacking", 0.0, 0.68)
	var glass := _super_part(root, Vector3(0.79, 0.65, 0.43), Color("fff4dc"), Vector3(0, 2.03, 0), "GlassChamber", 0.0, 0.12)
	var glass_material := StandardMaterial3D.new()
	glass_material.albedo_color = Color(1.0, 0.94, 0.84, 0.16)
	glass_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass_material.roughness = 0.10
	glass_material.metallic = 0.02
	glass_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	glass.material_override = glass_material
	# Capsules are deliberately arranged rather than physics-piled so the display
	# remains stable and readable in the web build.
	var capsule_points: Array[Vector3] = [
		Vector3(-0.50, 1.67, 0.38), Vector3(-0.17, 1.67, 0.39), Vector3(0.17, 1.67, 0.39), Vector3(0.50, 1.67, 0.38),
		Vector3(-0.60, 1.98, 0.37), Vector3(-0.30, 1.98, 0.40), Vector3(0.0, 1.98, 0.39), Vector3(0.30, 1.98, 0.40), Vector3(0.60, 1.98, 0.37),
		Vector3(-0.50, 2.29, 0.38), Vector3(-0.17, 2.29, 0.40), Vector3(0.17, 2.29, 0.40), Vector3(0.50, 2.29, 0.38),
	]
	for index in range(capsule_points.size()):
		var capsule_position: Vector3 = capsule_points[index]
		_two_tone_capsule(root, Vector3.ONE * 0.29, red, capsule_position, "KenWhiteRedCapsule%d" % index)

	# Heavy lacquered crown and the cream illustrated marquee.
	_super_part(root, Vector3(0.82, 0.19, 0.45), red, Vector3(0, 2.80, 0), "RedCrown", 0.08, 0.24)
	_super_part(root, Vector3(0.68, 0.12, 0.035), cream, Vector3(0, 2.80, 0.458), "CreamMarquee", 0.0, 0.46)
	for flower_x in [-0.42, 0.0, 0.42]:
		_add_rosette(root, Vector3(flower_x, 2.80, 0.505), red, blue, gold)
	_super_part(root, Vector3(0.82, 0.075, 0.45), red, Vector3(0, 2.62, 0), "RedChamberRail", 0.08, 0.25)
	_super_part(root, Vector3(0.82, 0.065, 0.45), cream, Vector3(0, 1.39, 0), "CreamChamberRail", 0.0, 0.36)

	# Blue ornamental appliques with raised gold linework.
	var left_panel := _super_part(root, Vector3(0.25, 0.55, 0.025), blue, Vector3(-0.52, 0.77, 0.432), "LeftOrnamentalPanel", 0.02, 0.40)
	left_panel.rotation.z = -0.08
	var right_panel := _super_part(root, Vector3(0.25, 0.43, 0.025), blue, Vector3(0.53, 0.55, 0.432), "RightOrnamentalPanel", 0.02, 0.40)
	right_panel.rotation.z = 0.08
	for side in [-1.0, 1.0]:
		for row in range(4):
			var motif_x: float = float(side) * (0.47 + 0.035 * float(row % 2))
			var motif_y: float = 0.39 + float(row) * 0.24
			_add_rosette(root, Vector3(motif_x, motif_y, 0.475), gold, red, gold, 0.07)

	# Oversized red ship-wheel dial, direction arc, blue coin controls and chute.
	var dial_back := CylinderMesh.new()
	dial_back.top_radius = 0.34
	dial_back.bottom_radius = 0.34
	dial_back.height = 0.10
	var dial := _mesh(root, dial_back, red, Vector3(-0.08, 0.87, 0.49), "RedShipWheel", 0.10, 0.24)
	dial.rotation.x = PI * 0.5
	for spoke_index in range(8):
		var angle := spoke_index * TAU / 8.0
		var spoke := _box(root, Vector3(0.055, 0.31, 0.065), red, Vector3(-0.08 + cos(angle) * 0.16, 0.87 + sin(angle) * 0.16, 0.56), "WheelSpoke%d" % spoke_index, 0.08)
		spoke.rotation.z = angle - PI * 0.5
	_sphere(root, Vector3(0.13, 0.13, 0.055), red, Vector3(-0.08, 0.87, 0.57), "WheelHub")
	# The four blue dots and curved-arrow endpoints preserve the reference's face layout.
	for dot in [Vector2(-0.45, 0.87), Vector2(0.29, 0.87), Vector2(-0.08, 1.22), Vector2(-0.08, 0.52)]:
		_sphere(root, Vector3(0.025, 0.025, 0.018), blue, Vector3(dot.x, dot.y, 0.565), "BlueGuideDot")
	_super_part(root, Vector3(0.12, 0.22, 0.035), blue, Vector3(0.51, 0.98, 0.465), "CoinPlate", 0.08, 0.27)
	_super_part(root, Vector3(0.026, 0.11, 0.024), dark, Vector3(0.51, 1.03, 0.507), "CoinSlot", 0.15, 0.22)
	_super_part(root, Vector3(0.10, 0.10, 0.05), blue, Vector3(0.51, 0.69, 0.50), "CoinReturn", 0.10, 0.26)
	_super_part(root, Vector3(0.34, 0.23, 0.12), blue, Vector3(0.02, 0.27, 0.45), "PrizeChuteFrame", 0.04, 0.34)
	_super_part(root, Vector3(0.27, 0.15, 0.08), dark, Vector3(0.02, 0.30, 0.555), "PrizeChuteOpening", 0.0, 0.78)
	return stand

static func _add_rosette(parent: Node3D, position: Vector3, petal_color: Color, center_color: Color, accent_color: Color, scale_factor := 0.11) -> void:
	for petal_index in range(6):
		var angle := petal_index * TAU / 6.0
		var petal := _sphere(parent, Vector3(scale_factor * 0.55, scale_factor, scale_factor * 0.18), petal_color, position + Vector3(cos(angle) * scale_factor, sin(angle) * scale_factor, 0), "RosettePetal")
		petal.rotation.z = angle - PI * 0.5
	_sphere(parent, Vector3(scale_factor * 0.48, scale_factor * 0.48, scale_factor * 0.20), center_color, position + Vector3(0, 0, 0.008), "RosetteCenter")
	_sphere(parent, Vector3(scale_factor * 0.18, scale_factor * 0.18, scale_factor * 0.22), accent_color, position + Vector3(0, 0, 0.018), "RosetteAccent")

static func _arcade(parent: Node3D, position: Vector3, game: String) -> Node3D:
	var is_lapis := game == "lapis"
	# These colors come directly from each game rather than from the hub's
	# generic palette. Lapis is nocturnal forest + lime/coral; Kueh Bakery
	# is warm cream, caramel timber, gold signage, and red/green controls.
	var title := "Lapis" if is_lapis else "KuehBakery"
	var lower_color := Color("0e2110") if is_lapis else Color("7a4818")
	var upper_color := Color("132b16") if is_lapis else Color("9b5e20")
	var accent := Color("8fd400") if is_lapis else Color("c4863a")
	# Per direct correction: a separate inner "screen" superegg nested inside
	# this bezel didn't read right, so the bezel itself is plain black again
	# rather than a per-project tint framing a second shape.
	var bezel_color := Color("0d0d0d")
	var primary_button := Color("e8503a") if is_lapis else Color("d42020")
	var secondary_button := Color("fdf5ee") if is_lapis else Color("3d9a3d")
	var logo_texture := LAPIS_LOGO if is_lapis else BAKERY_LOGO
	var root := Node3D.new()
	root.name = title + "Arcade"
	root.position = position
	# HubMain owns world-facing orientation for every returned display. Rotating
	# here as well turned side-run cabinets twice, hiding their textured fronts.
	root.rotation.y = 0.0
	parent.add_child(root)
	_box_collision(root, Vector3(1.50, 2.55, 1.12), Vector3(0, 1.27, 0.02), "ArcadeCabinetSolidBody")
	# Proportions follow wip/arcade-machine.obj: a deep upright base, recessed
	# sloped screen, projecting control shelf, and a proud top marquee. The
	# casing is rebuilt from flat-ended superellipsoids so it belongs to the
	# same soft-object language as the figures and pedestals.
	_super_part(root, Vector3(0.68, 0.72, 0.43), lower_color, Vector3(0, 0.73, -0.03), "LowerCabinet")
	var shoulder := _super_part(root, Vector3(0.67, 0.49, 0.41), upper_color, Vector3(0, 1.67, -0.08), "ScreenHousing")
	shoulder.rotation.x = -0.035
	var crown := _super_part(root, Vector3(0.70, 0.23, 0.46), accent, Vector3(0, 2.28, 0.02), "MarqueeHousing")
	crown.rotation.x = 0.025
	var screen_bezel := _super_part(root, Vector3(0.53, 0.38, 0.055), bezel_color, Vector3(0, 1.70, 0.385), "ScreenBezel", 0.06, 0.34)
	screen_bezel.rotation.x = -0.10
	var deck := _super_part(root, Vector3(0.64, 0.12, 0.47), accent, Vector3(0, 1.18, 0.27), "ControlDeck", 0.04, 0.5)
	deck.rotation.x = -0.055
	var stick := _super_part(root, Vector3(0.055, 0.15, 0.055), Color("252525"), Vector3(-0.25, 1.37, 0.42), "JoystickStem", 0.12, 0.34)
	stick.rotation.x = -0.055
	_super_part(root, Vector3(0.105, 0.085, 0.105), Color("202020"), Vector3(-0.25, 1.51, 0.41), "JoystickTop", 0.08, 0.3)
	_super_part(root, Vector3(0.09, 0.045, 0.09), primary_button, Vector3(0.22, 1.34, 0.49), "ActionButton", 0.05, 0.38)
	_super_part(root, Vector3(0.075, 0.038, 0.075), secondary_button, Vector3(0.41, 1.32, 0.48), "SecondButton", 0.05, 0.38)
	# Project-colored side rails make the whole silhouette carry the game,
	# rather than confining identity to a small logo sticker.
	_super_part(root, Vector3(0.055, 0.56, 0.45), accent, Vector3(-0.64, 0.72, -0.02), "LeftColorRail", 0.04, 0.46)
	_super_part(root, Vector3(0.055, 0.56, 0.45), accent, Vector3(0.64, 0.72, -0.02), "RightColorRail", 0.04, 0.46)
	# Small rounded feet create a contact shadow and stop the cabinet reading
	# as a single monolithic box planted directly into the floor.
	_super_part(root, Vector3(0.20, 0.08, 0.25), Color("282828"), Vector3(-0.38, 0.08, 0.0), "LeftFoot")
	_super_part(root, Vector3(0.20, 0.08, 0.25), Color("282828"), Vector3(0.38, 0.08, 0.0), "RightFoot")
	var logo := Sprite3D.new()
	logo.name = "ActualProjectLogo"
	logo.texture = logo_texture
	# Fit the actual vector into the usable marquee face in both dimensions.
	# This handles the projects' different SVG aspect ratios without clipping.
	var logo_size := logo_texture.get_size()
	var marquee_max_size := Vector2(1.12, 0.32)
	logo.pixel_size = minf(marquee_max_size.x / logo_size.x, marquee_max_size.y / logo_size.y)
	logo.position = Vector3(0, 2.29, 0.495)
	logo.rotation.x = 0.025
	logo.shaded = false
	logo.double_sided = true
	root.add_child(logo)
	return root

static func _cat_station(parent: Node3D, position: Vector3) -> Node3D:
	var stand := pedestal(parent, position, 0.62, 0.90)
	var cat := HubCat.new()
	cat.name = "PedestalCat"
	cat.coat_color = Color("c6c7c5")
	cat.sitting = true
	cat.roaming = false
	cat.position = Vector3(0, 0.90, 0)
	stand.add_child(cat)
	return stand

static func _remember_station(parent: Node3D, position: Vector3) -> Node3D:
	var stand := pedestal(parent, position)
	var stereo := Node3D.new()
	stereo.name = "SamanthasRememberFmStereo"
	stereo.position.y = 0.95
	stand.add_child(stereo)
	_box_collision(stereo, Vector3(1.42, 0.72, 0.54), Vector3(0, 0.38, 0), "StereoSystemSolidBody")

	# A compact Y2K stereo derived from remember.fm's blue-grey Discman imagery,
	# black interface, iridescent CD, and sharp lime-green UI accent.
	var shell := Color("8797a8")
	var shell_light := Color("b9c4ce")
	var dark := Color("111316")
	var grille := Color("252a30")
	var lime := Color("c2f02e")
	var purple := Color("b9a8ff")
	var cyan := Color("9fe2ff")

	# Paired rounded speakers frame the central CD deck.
	for side_index in range(2):
		var side := -1.0 if side_index == 0 else 1.0
		_super_part(stereo, Vector3(0.26, 0.34, 0.24), shell, Vector3(side * 0.47, 0.36, 0), "SpeakerCase%d" % side_index, 0.12, 0.48)
		var woofer := CylinderMesh.new()
		woofer.top_radius = 0.16
		woofer.bottom_radius = 0.16
		woofer.height = 0.035
		woofer.radial_segments = 24
		var woofer_node := _mesh(stereo, woofer, grille, Vector3(side * 0.47, 0.34, 0.238), "SpeakerGrille%d" % side_index, 0.05, 0.76)
		woofer_node.rotation.x = PI * 0.5
		_sphere(stereo, Vector3(0.045, 0.045, 0.025), shell_light, Vector3(side * 0.47, 0.57, 0.255), "SpeakerTweeter%d" % side_index)

	_super_part(stereo, Vector3(0.31, 0.30, 0.25), shell_light, Vector3(0, 0.35, 0), "CentralCDDeck", 0.18, 0.42)
	# The exposed disc sits flush in the front face rather than hovering on a plane.
	var disc := CylinderMesh.new()
	disc.top_radius = 0.205
	disc.bottom_radius = 0.205
	disc.height = 0.028
	disc.radial_segments = 32
	var disc_node := _mesh(stereo, disc, purple, Vector3(0, 0.39, 0.257), "IridescentCompactDisc", 0.55, 0.24)
	disc_node.rotation.x = PI * 0.5
	var disc_glint := CylinderMesh.new()
	disc_glint.top_radius = 0.135
	disc_glint.bottom_radius = 0.135
	disc_glint.height = 0.031
	disc_glint.radial_segments = 32
	var glint_node := _mesh(stereo, disc_glint, cyan, Vector3(0, 0.39, 0.260), "CompactDiscGlint", 0.45, 0.26)
	glint_node.rotation.x = PI * 0.5
	var hub := CylinderMesh.new()
	hub.top_radius = 0.042
	hub.bottom_radius = 0.042
	hub.height = 0.036
	var hub_node := _mesh(stereo, hub, dark, Vector3(0, 0.39, 0.266), "CompactDiscHub", 0.1, 0.48)
	hub_node.rotation.x = PI * 0.5

	# A small lime display and tactile controls tie the hardware to the app UI.
	_super_part(stereo, Vector3(0.16, 0.045, 0.018), dark, Vector3(0, 0.66, 0.252), "DigitalDisplayBezel", 0.05, 0.48)
	_super_part(stereo, Vector3(0.125, 0.023, 0.020), lime, Vector3(0, 0.66, 0.271), "RememberFmLimeDisplay", 0.0, 0.38)
	for button_index in range(3):
		_sphere(stereo, Vector3(0.045, 0.028, 0.020), dark, Vector3(-0.075 + float(button_index) * 0.075, 0.105, 0.257), "StereoButton%d" % button_index)
	return stand

static func _amanda_bear(parent: Node3D, position: Vector3) -> Node3D:
	var stand := pedestal(parent, position, 0.62, 0.90)
	var bear := Node3D.new()
	bear.name = "AmandasSeatedPlushBear"
	bear.position.y = 0.90
	# The returned pedestal is oriented inward by HubMain. Keeping the bear in
	# the pedestal's forward basis avoids applying that world-facing turn twice.
	bear.rotation.y = 0.0
	stand.add_child(bear)
	_box_collision(bear, Vector3(1.12, 1.55, 0.88), Vector3(0, 0.77, 0.08), "PlushBearSolidBody")
	var caramel := Color("c98239")
	var caramel_dark := Color("aa6428")
	var cream := Color("f5ddb7")
	var ink := Color("2b1b0d")
	var blush := Color("d98a58")
	# A true ellipsoid keeps the torso soft and toy-like; the previous flat-ended
	# superellipsoid made the bear read as a squared cabinet with limbs.
	_sphere(bear, Vector3(0.72, 0.80, 0.56), caramel, Vector3(0, 0.40, 0), "RoundedPlushBody")
	_sphere(bear, Vector3(0.34, 0.24, 0.30), caramel_dark, Vector3(-0.23, 0.18, 0.08), "LeftSeatedHaunch")
	_sphere(bear, Vector3(0.34, 0.24, 0.30), caramel_dark, Vector3(0.23, 0.18, 0.08), "RightSeatedHaunch")
	_sphere(bear, Vector3(0.30, 0.16, 0.32), caramel, Vector3(-0.22, 0.09, 0.22), "LeftForwardPaw")
	_sphere(bear, Vector3(0.30, 0.16, 0.32), caramel, Vector3(0.22, 0.09, 0.22), "RightForwardPaw")
	# Arms descend forward from the shoulder instead of hanging vertically;
	# their rounded ends form the paws without separate hand pieces.
	var left_arm := _sphere(bear, Vector3(0.23, 0.42, 0.20), caramel, Vector3(-0.32, 0.45, 0.13), "LeftPlushArm")
	left_arm.rotation.z = deg_to_rad(-17.0)
	left_arm.rotation.x = deg_to_rad(-30.0)
	var right_arm := _sphere(bear, Vector3(0.23, 0.42, 0.20), caramel, Vector3(0.32, 0.45, 0.13), "RightPlushArm")
	right_arm.rotation.z = deg_to_rad(17.0)
	right_arm.rotation.x = deg_to_rad(-30.0)
	# Large head, round ears and simple embroidered-looking facial pieces.
	_sphere(bear, Vector3(0.78, 0.68, 0.54), caramel, Vector3(0, 0.95, 0.03), "OversizedBearHead")
	_sphere(bear, Vector3(0.30, 0.30, 0.18), caramel, Vector3(-0.30, 1.22, -0.02), "LeftRoundEar")
	_sphere(bear, Vector3(0.30, 0.30, 0.18), caramel, Vector3(0.30, 1.22, -0.02), "RightRoundEar")
	_sphere(bear, Vector3(0.14, 0.14, 0.035), caramel_dark, Vector3(-0.30, 1.22, 0.078), "LeftInnerEar")
	_sphere(bear, Vector3(0.14, 0.14, 0.035), caramel_dark, Vector3(0.30, 1.22, 0.078), "RightInnerEar")
	_sphere(bear, Vector3(0.32, 0.25, 0.10), cream, Vector3(0, 0.86, 0.292), "CreamMuzzle")
	_sphere(bear, Vector3(0.060, 0.090, 0.028), ink, Vector3(-0.15, 1.02, 0.295), "LeftButtonEye")
	_sphere(bear, Vector3(0.060, 0.090, 0.028), ink, Vector3(0.15, 1.02, 0.295), "RightButtonEye")
	_sphere(bear, Vector3(0.105, 0.070, 0.035), ink, Vector3(0, 0.89, 0.354), "BearNose")
	# Each cheek follows the local tangent of the round head. Their outward yaw
	# prevents the patches from hovering as two flat, coplanar dots.
	var left_blush := _sphere(bear, Vector3(0.11, 0.075, 0.025), blush, Vector3(-0.25, 0.87, 0.248), "LeftCurvedBlush")
	left_blush.rotation.y = deg_to_rad(-32.0)
	var right_blush := _sphere(bear, Vector3(0.11, 0.075, 0.025), blush, Vector3(0.25, 0.87, 0.248), "RightCurvedBlush")
	right_blush.rotation.y = deg_to_rad(32.0)
	return stand

static func _jesslyn_cake(parent: Node3D, position: Vector3) -> Node3D:
	var stand := pedestal(parent, position, 0.62, 0.90)
	var cake := Node3D.new()
	cake.name = "JesslynsBirthdayCake"
	cake.position.y = 0.90
	cake.scale = Vector3.ONE * 0.67
	var inward := Vector3.ZERO - position
	cake.rotation.y = atan2(inward.x, inward.z)
	stand.add_child(cake)
	_box_collision(cake, Vector3(1.05, 1.20, 1.05), Vector3(0, 0.60, 0), "BirthdayCakeSolidBody")

	var sponge := Color("e2a457")
	var cream := Color("fff4df")
	var pink_icing := Color("ef8da5")
	var berry := Color("d94a4f")
	var candle_blue := Color("6ba6d9")
	var candle_yellow := Color("f1c84d")

	# Two soft cylindrical tiers echo the emoji's celebratory layer cake while
	# retaining the hub's flat-ended superegg construction language.
	_super_part(cake, Vector3(0.48, 0.25, 0.48), sponge, Vector3(0, 0.26, 0), "LowerSponge", 0.0, 0.82)
	_super_part(cake, Vector3(0.50, 0.095, 0.50), cream, Vector3(0, 0.50, 0), "LowerCreamFrosting", 0.0, 0.68)
	_super_part(cake, Vector3(0.39, 0.20, 0.39), sponge, Vector3(0, 0.67, 0), "UpperSponge", 0.0, 0.82)
	_super_part(cake, Vector3(0.41, 0.10, 0.41), pink_icing, Vector3(0, 0.86, 0), "PinkTopFrosting", 0.0, 0.64)

	# Rounded frosting drops make the top icing feel applied to the cake rather
	# than stacked as one disconnected slab.
	for drop_index in range(8):
		var drop_angle := float(drop_index) * TAU / 8.0
		var drop_position := Vector3(cos(drop_angle) * 0.34, 0.79, sin(drop_angle) * 0.34)
		_sphere(cake, Vector3(0.12, 0.20, 0.12), pink_icing, drop_position, "IcingDrop%d" % drop_index)

	# The emoji's red decorations become small berry-like frosting dots around
	# the upper rim, with three striped candles as the focal point.
	for berry_index in range(8):
		var berry_angle := float(berry_index) * TAU / 8.0 + PI / 8.0
		_sphere(cake, Vector3(0.11, 0.11, 0.11), berry, Vector3(cos(berry_angle) * 0.32, 0.94, sin(berry_angle) * 0.32), "BerryDecoration%d" % berry_index)

	var candle_positions: Array[Vector3] = [Vector3(-0.20, 1.12, 0), Vector3(0, 1.17, -0.04), Vector3(0.20, 1.12, 0)]
	var candle_colors: Array[Color] = [pink_icing, candle_blue, candle_yellow]
	for candle_index in range(candle_positions.size()):
		var candle_pos: Vector3 = candle_positions[candle_index]
		_super_part(cake, Vector3(0.035, 0.18, 0.035), candle_colors[candle_index], candle_pos, "BirthdayCandle%d" % candle_index, 0.0, 0.55)
		# Short cream bands provide the cheerful striped-candle detail.
		for stripe_index in range(2):
			_super_part(cake, Vector3(0.038, 0.018, 0.038), cream, candle_pos + Vector3(0, -0.06 + stripe_index * 0.11, 0), "CandleStripe%d_%d" % [candle_index, stripe_index], 0.0, 0.62)
		var flame_pos := candle_pos + Vector3(0, 0.25, 0)
		_sphere(cake, Vector3(0.075, 0.13, 0.055), Color("f59b35"), flame_pos, "CandleFlame%d" % candle_index)
		_sphere(cake, Vector3(0.030, 0.060, 0.026), Color("fff0a6"), flame_pos + Vector3(0, 0.005, 0.028), "CandleFlameCore%d" % candle_index)
	return stand

static func _kaixin_microphone(parent: Node3D, position: Vector3) -> Node3D:
	# This display stands directly on the void floor; unlike the art objects it
	# intentionally has no museum pedestal.
	var root := Node3D.new()
	root.name = "KaixinsFloorMicrophone"
	root.position = position
	var inward := Vector3.ZERO - position
	root.rotation.y = atan2(inward.x, inward.z)
	parent.add_child(root)
	_box_collision(root, Vector3(0.74, 1.98, 1.02), Vector3(0, 0.99, 0.16), "MicrophoneStandSolidBody")

	var stand_black := Color("202124")
	var grip_black := Color("292a2d")
	var steel := Color("bfc4c7")
	var grille_dark := Color("60666a")

	# Weighted domed base and concentric compression rings.
	_super_part(root, Vector3(0.36, 0.085, 0.36), stand_black, Vector3(0, 0.085, 0), "WeightedStandBase", 0.18, 0.42)
	for ring_index in range(3):
		var base_ring := TorusMesh.new()
		base_ring.inner_radius = 0.10 + float(ring_index) * 0.055
		base_ring.outer_radius = 0.115 + float(ring_index) * 0.055
		_mesh(root, base_ring, grip_black, Vector3(0, 0.17 + float(ring_index) * 0.002, 0), "BaseRing%d" % ring_index, 0.15, 0.44)

	var lower_pole_mesh := CylinderMesh.new()
	lower_pole_mesh.top_radius = 0.026
	lower_pole_mesh.bottom_radius = 0.026
	lower_pole_mesh.height = 0.98
	_mesh(root, lower_pole_mesh, stand_black, Vector3(0, 0.64, 0), "LowerStandPole", 0.34, 0.30)
	var upper_pole_mesh := CylinderMesh.new()
	upper_pole_mesh.top_radius = 0.021
	upper_pole_mesh.bottom_radius = 0.021
	upper_pole_mesh.height = 0.36
	_mesh(root, upper_pole_mesh, steel, Vector3(0, 1.33, 0), "ChromeTelescopingPole", 0.72, 0.20)
	var collar_mesh := CylinderMesh.new()
	collar_mesh.top_radius = 0.048
	collar_mesh.bottom_radius = 0.048
	collar_mesh.height = 0.09
	_mesh(root, collar_mesh, grip_black, Vector3(0, 1.14, 0), "HeightAdjustmentCollar", 0.12, 0.40)

	# The clip grows directly from the pole and holds a microphone pitched up
	# in the same side-profile stance as the supplied reference.
	_super_part(root, Vector3(0.075, 0.12, 0.065), grip_black, Vector3(0, 1.54, 0), "MicrophoneClip", 0.10, 0.40)
	var mic := Node3D.new()
	mic.name = "ForwardFacingMicrophone"
	mic.position = Vector3(0.08, 1.64, 0.015)
	# Pitch in the local Y/Z plane so the grille points out into the room;
	# rotating in X/Y here would only present a sideways stage-profile mic.
	mic.rotation.x = deg_to_rad(57.0)
	root.add_child(mic)

	var handle_mesh := CylinderMesh.new()
	handle_mesh.top_radius = 0.060
	handle_mesh.bottom_radius = 0.046
	handle_mesh.height = 0.46
	_mesh(mic, handle_mesh, grip_black, Vector3(0, 0.06, 0), "MicrophoneHandle", 0.18, 0.34)
	var neck_mesh := CylinderMesh.new()
	neck_mesh.top_radius = 0.074
	neck_mesh.bottom_radius = 0.058
	neck_mesh.height = 0.10
	_mesh(mic, neck_mesh, steel, Vector3(0, 0.33, 0), "SilverGrilleBand", 0.72, 0.22)
	_sphere(mic, Vector3(0.20, 0.24, 0.20), steel, Vector3(0, 0.48, 0), "RoundedSilverGrille")
	# Dark latitude hoops suggest woven grille structure without applying a
	# flat photographic texture to the modeled microphone.
	for grille_index in range(3):
		var grille_ring := TorusMesh.new()
		grille_ring.inner_radius = 0.079 + float(grille_index) * 0.004
		grille_ring.outer_radius = 0.086 + float(grille_index) * 0.004
		_mesh(mic, grille_ring, grille_dark, Vector3(0, 0.42 + float(grille_index) * 0.055, 0), "GrilleRing%d" % grille_index, 0.38, 0.28)
	return root

static func _viki_kueh_platter(parent: Node3D, position: Vector3) -> Node3D:
	var stand := pedestal(parent, position, 0.62, 0.90)
	var serving := Node3D.new()
	serving.name = "VikisTwoKuehPlatter"
	serving.position.y = 0.90
	var inward := Vector3.ZERO - position
	serving.rotation.y = atan2(inward.x, inward.z)
	stand.add_child(serving)
	_box_collision(serving, Vector3(0.84, 0.30, 0.62), Vector3(0, 0.15, 0), "KuehPlatterSolidBody")

	var platter_white := Color("fffdf8")
	var platter_rim := Color("dedbd2")
	var festive_red := Color("cf3553")
	var leaf_green := Color("197346")
	var cream_layer := Color("eee7d4")
	var pandan_green := Color("75c889")
	var pandan_shadow := Color("54aa6d")
	var gula_melaka := Color("61351f")
	var coconut := Color("f3eedc")

	# Scale the platter independently to 75% while keeping its top at the same
	# usable serving height above the pedestal.
	var platter_group := Node3D.new()
	platter_group.name = "ReducedPlatter"
	platter_group.position.y = 0.03
	platter_group.scale = Vector3.ONE * 0.75
	serving.add_child(platter_group)
	_sphere(platter_group, Vector3(1.02, 0.10, 0.70), platter_rim, Vector3(0, 0.08, 0), "PlatterLowerRim")
	_sphere(platter_group, Vector3(0.94, 0.075, 0.62), platter_white, Vector3(0, 0.115, 0), "WhiteServingPlatter")

	# Both kuehs are 34% of their previous size (66% smaller). Their shared
	# origin sits on the resized platter so vertical scaling cannot sink them.
	var kueh_group := Node3D.new()
	kueh_group.name = "ReducedKuehs"
	kueh_group.position.y = 0.145
	kueh_group.scale = Vector3.ONE * 0.34
	serving.add_child(kueh_group)

	# Seven individually modeled layers reproduce the project slice's alternating
	# red, green and cream stack, with a red cap and softly rounded corners.
	var layer_colors: Array[Color] = [cream_layer, leaf_green, festive_red, cream_layer, leaf_green, festive_red, festive_red]
	for layer_index in range(layer_colors.size()):
		var layer_y := 0.031 + float(layer_index) * 0.060
		_super_part(kueh_group, Vector3(0.245, 0.031, 0.185), layer_colors[layer_index], Vector3(-0.25, layer_y, 0.01), "LayeredKuehBand%d" % layer_index, 0.0, 0.66)

	# One whole pandan-and-coconut ball sits behind a cut-open companion. The
	# flattened brown core on the front face makes the filling readable from the
	# inward viewing side without resorting to a flat image plane.
	_sphere(kueh_group, Vector3(0.32, 0.32, 0.32), pandan_green, Vector3(0.30, 0.18, -0.10), "WholePandanKueh")
	_sphere(kueh_group, Vector3(0.34, 0.34, 0.20), pandan_shadow, Vector3(0.20, 0.17, 0.12), "CutPandanKuehOuter")
	_sphere(kueh_group, Vector3(0.205, 0.205, 0.035), gula_melaka, Vector3(0.20, 0.17, 0.225), "VisiblePalmSugarFilling")

	# Sparse coconut shreds are short cream slivers laid onto both green shells.
	var shred_points: Array[Vector3] = [
		Vector3(0.22, 0.29, 0.20), Vector3(0.31, 0.22, 0.18), Vector3(0.11, 0.13, 0.22),
		Vector3(0.34, 0.32, -0.01), Vector3(0.40, 0.19, -0.01), Vector3(0.24, 0.40, -0.06),
		Vector3(0.18, 0.27, -0.02), Vector3(0.43, 0.10, -0.02),
	]
	for shred_index in range(shred_points.size()):
		var shred := _box(kueh_group, Vector3(0.065, 0.012, 0.012), coconut, shred_points[shred_index], "CoconutShred%d" % shred_index)
		shred.rotation.z = deg_to_rad(-35.0 + float(shred_index % 4) * 23.0)
	return stand

static func _meijun_gas_range(parent: Node3D, position: Vector3) -> Node3D:
	# A domestic appliance belongs directly on the floor rather than on a
	# museum pedestal. Its front is rotated toward the room's viewing side.
	var root := Node3D.new()
	root.name = "MeiJunsHomeGasRange"
	root.position = position
	root.scale = Vector3.ONE * 0.80
	var inward := Vector3.ZERO - position
	root.rotation.y = atan2(inward.x, inward.z)
	parent.add_child(root)
	_box_collision(root, Vector3(1.28, 1.72, 0.92), Vector3(0, 0.86, 0), "GasRangeSolidBody")

	var enamel := Color("f5f6f4")
	var enamel_shadow := Color("d9dcda")
	var appliance_black := Color("17191c")
	var oven_glass := Color("263038")
	var steel := Color("aeb4b7")

	# Rounded enamel cabinet with a shallow plinth and slightly proud cooktop.
	_super_part(root, Vector3(0.62, 0.79, 0.43), enamel, Vector3(0, 0.83, 0), "WhiteEnamelRangeBody", 0.03, 0.48)
	_super_part(root, Vector3(0.59, 0.075, 0.42), enamel_shadow, Vector3(0, 0.09, 0), "RangePlinth", 0.02, 0.52)
	_super_part(root, Vector3(0.65, 0.075, 0.46), enamel, Vector3(0, 1.58, 0), "RaisedCooktop", 0.04, 0.42)

	# Black oven fascia, inset smoked-glass window and a broad pale handle.
	_super_part(root, Vector3(0.54, 0.43, 0.035), appliance_black, Vector3(0, 0.70, 0.438), "BlackOvenDoor", 0.12, 0.34)
	_super_part(root, Vector3(0.40, 0.27, 0.020), oven_glass, Vector3(0, 0.69, 0.478), "SmokedOvenWindow", 0.22, 0.24)
	_super_part(root, Vector3(0.45, 0.035, 0.045), enamel, Vector3(0, 1.10, 0.505), "OvenDoorHandle", 0.10, 0.34)
	_super_part(root, Vector3(0.56, 0.055, 0.030), appliance_black, Vector3(0, 1.34, 0.465), "BlackControlStrip", 0.08, 0.30)

	# Five front-facing control knobs. Cylinder axes are rotated from vertical to
	# project toward the viewer like the reference appliance.
	for knob_index in range(5):
		var knob_mesh := CylinderMesh.new()
		knob_mesh.top_radius = 0.065
		knob_mesh.bottom_radius = 0.065
		knob_mesh.height = 0.055
		var knob_x := -0.40 + float(knob_index) * 0.20
		var knob := _mesh(root, knob_mesh, appliance_black, Vector3(knob_x, 1.23, 0.488), "ControlKnob%d" % knob_index, 0.12, 0.32)
		knob.rotation.x = PI * 0.5

	# Four burners and rectilinear cast-iron supports form the gas hob.
	var burner_positions: Array[Vector3] = [
		Vector3(-0.34, 1.67, -0.20), Vector3(0.34, 1.67, -0.20),
		Vector3(-0.34, 1.67, 0.20), Vector3(0.34, 1.67, 0.20),
	]
	for burner_index in range(burner_positions.size()):
		var burner_pos: Vector3 = burner_positions[burner_index]
		var burner_ring := TorusMesh.new()
		burner_ring.inner_radius = 0.075
		burner_ring.outer_radius = 0.105
		_mesh(root, burner_ring, appliance_black, burner_pos, "GasBurner%d" % burner_index, 0.18, 0.36)
		for grate_angle in [0.0, PI * 0.5]:
			var grate := _box(root, Vector3(0.38, 0.035, 0.045), appliance_black, burner_pos + Vector3(0, 0.035, 0), "BurnerGrate%d" % burner_index, 0.14)
			grate.rotation.y = grate_angle

	# Per direct instruction: the flame tongues under the wok are gone --
	# the front-left hob is unlit now.
	var active_burner := burner_positions[2]

	# A shallow, double-sided lower hemisphere forms the wok: a single open
	# shell, double-sided so the same surface reads as both the outer bowl
	# and (looking in through the open top) its own concave interior. Per
	# direct correction: an earlier nested second hemisphere meant to give
	# the interior a distinct color instead read as a lid/filling sitting
	# across the opening, so there is deliberately only this one shell now --
	# no separate interior mesh, no food surface, no lid.
	#
	# Per a further direct correction: SphereMesh's own is_hemisphere flag
	# does NOT leave the equator open -- it silently caps it with a flat
	# disc (confirmed by dumping its own generated arrays: a full third of
	# its triangles have all 3 vertices sitting exactly on that flat plane).
	# Once flipped rim-up, that disc is exactly the flat surface reported
	# sitting across the wok's opening. _open_hemisphere_mesh() below builds
	# the same SphereMesh and strips those cap-plane triangles out, leaving
	# a genuinely open curved shell.
	var wok_mesh := _open_hemisphere_mesh(0.5, 28, 10)
	var wok_material := StandardMaterial3D.new()
	wok_material.albedo_color = steel
	wok_material.metallic = 0.78
	wok_material.roughness = 0.30
	wok_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	var wok := MeshInstance3D.new()
	wok.name = "SteelWokBowl"
	wok.mesh = wok_mesh
	wok.material_override = wok_material
	wok.scale = Vector3(0.72, 0.30, 0.72)
	wok.position = active_burner + Vector3(0, 0.25, 0)
	wok.rotation.x = PI
	root.add_child(wok)
	var wok_rim_mesh := TorusMesh.new()
	wok_rim_mesh.inner_radius = 0.335
	wok_rim_mesh.outer_radius = 0.365
	_mesh(root, wok_rim_mesh, steel, active_burner + Vector3(0, 0.25, 0), "WokRolledRim", 0.78, 0.28)
	# Each side grip is a raised metal loop in the YZ plane. Its lower arc sinks
	# into the rolled rim, producing two visible attachment points instead of a
	# disconnected stick projecting from the bowl. Per direct correction: the
	# loops previously sat far enough out (radius 0.39, well past the rim's
	# own outer_radius 0.365) that their near edge never actually reached the
	# rim mesh, reading as floating. Pulled in to 0.35 -- inside the rim's
	# outer edge -- so the loop's thin near side embeds into the rim's own
	# thickness instead of hovering just past it.
	for handle_side in [-1.0, 1.0]:
		var handle_mesh := TorusMesh.new()
		handle_mesh.inner_radius = 0.075
		handle_mesh.outer_radius = 0.102
		handle_mesh.rings = 20
		handle_mesh.ring_segments = 10
		var handle := _mesh(root, handle_mesh, steel, active_burner + Vector3(handle_side * 0.35, 0.31, 0), "WokLoopHandle", 0.76, 0.30)
		# Base PI*0.5 stands the loop up into the YZ plane; the extra
		# handle_side term (mirrored per side) then leans its top further
		# outward, away from the wok's own center, rather than both loops
		# leaning the same absolute direction. Per direct correction: the
		# original sign here leaned both loops INWARD, toward the pot --
		# negated to actually roll outward as intended.
		handle.rotation.z = PI * 0.5 - handle_side * deg_to_rad(18.0)
		handle.scale = Vector3(1.0, 1.18, 1.45)
	return root

static func _nicole_life_calculator(parent: Node3D, position: Vector3) -> Node3D:
	var stand := pedestal(parent, position, 0.62, 0.95)
	var calculator := Node3D.new()
	calculator.name = "NicolesLifeCalculator"
	calculator.position.y = 0.98
	# A shallow desktop-calculator pitch: the display sits slightly higher than
	# the front keys, while the whole object remains a realistic 36 x 50 cm.
	calculator.rotation.x = deg_to_rad(8.0)
	stand.add_child(calculator)

	# Colors come directly from Life Calculus's CSS tokens.
	var ivory := Color("f7f3ea")
	var pink := Color("c98a9c")
	var sage := Color("8fa888")
	var tan := Color("e8d9c4")
	var dark_brown := Color("3a3530")
	var muted := Color("8a8378")

	_super_part(calculator, Vector3(0.18, 0.026, 0.25), dark_brown, Vector3(0, 0.026, 0), "RoundedCalculatorBody", 0.0, 0.42)
	_super_part(calculator, Vector3(0.17, 0.010, 0.235), ivory, Vector3(0, 0.056, 0.005), "IvoryFaceInset", 0.0, 0.52)
	_super_part(calculator, Vector3(0.135, 0.009, 0.040), sage, Vector3(0.015, 0.071, -0.150), "SageLCD", 0.0, 0.24)
	_super_part(calculator, Vector3(0.055, 0.008, 0.025), muted, Vector3(-0.095, 0.070, -0.214), "MutedSolarCell", 0.0, 0.20)

	var display_text := Label3D.new()
	display_text.name = "LifeDisplayReadout"
	display_text.text = "LIFE"
	display_text.font_size = 42
	display_text.pixel_size = 0.0012
	display_text.modulate = dark_brown
	display_text.outline_size = 0
	display_text.shaded = false
	display_text.rotation.x = -PI * 0.5
	display_text.position = Vector3(0.045, 0.083, -0.150)
	calculator.add_child(display_text)

	var key_labels := [
		["7", "8", "9", "÷"],
		["4", "5", "6", "×"],
		["1", "2", "3", "−"],
		["0", "00", ".", "+"],
		["C", "%", "=", "?"],
	]
	for row_index in range(key_labels.size()):
		for column_index in range(4):
			var key_color := tan
			if column_index == 3:
				key_color = sage
			if row_index == key_labels.size() - 1:
				key_color = pink
			var key_position := Vector3(
				(column_index - 1.5) * 0.074,
				0.075,
				-0.070 + row_index * 0.058
			)
			_super_part(calculator, Vector3(0.030, 0.009, 0.020), key_color, key_position, "CalculatorKey_%d_%d" % [row_index, column_index], 0.0, 0.46)
			var key_label := Label3D.new()
			key_label.name = "KeyLabel_%d_%d" % [row_index, column_index]
			key_label.text = key_labels[row_index][column_index]
			key_label.font_size = 30
			key_label.pixel_size = 0.0010
			key_label.modulate = dark_brown
			key_label.outline_size = 0
			key_label.shaded = false
			key_label.rotation.x = -PI * 0.5
			key_label.position = key_position + Vector3(0, 0.013, 0)
			calculator.add_child(key_label)
	return stand

static func _water_glass_station(parent: Node3D, position: Vector3) -> Node3D:
	var stand := pedestal(parent, position, 0.62, 0.90)
	var glass_root := Node3D.new()
	glass_root.name = "NataliasGlassOfWater"
	glass_root.position.y = 0.90
	glass_root.scale = Vector3.ONE * 0.45
	stand.add_child(glass_root)
	_box_collision(glass_root, Vector3(0.46, 0.52, 0.46), Vector3(0, 0.27, 0), "WaterGlassSolidBody")

	# A lightly tapered transparent tumbler with a distinct open rim. The water
	# volume stops below that rim so the object cannot read as a capped cylinder.
	var glass_mesh := CylinderMesh.new()
	glass_mesh.top_radius = 0.20
	glass_mesh.bottom_radius = 0.16
	glass_mesh.height = 0.48
	glass_mesh.radial_segments = 32
	var glass_material := StandardMaterial3D.new()
	glass_material.albedo_color = Color(0.88, 0.95, 1.0, 0.20)
	glass_material.metallic = 0.05
	glass_material.roughness = 0.12
	glass_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	var tumbler := MeshInstance3D.new()
	tumbler.name = "ClearGlassTumbler"
	tumbler.mesh = glass_mesh
	tumbler.material_override = glass_material
	tumbler.position.y = 0.25
	glass_root.add_child(tumbler)

	var water_mesh := CylinderMesh.new()
	water_mesh.top_radius = 0.175
	water_mesh.bottom_radius = 0.145
	water_mesh.height = 0.34
	water_mesh.radial_segments = 32
	var water_material := StandardMaterial3D.new()
	water_material.albedo_color = Color(0.50, 0.78, 0.92, 0.48)
	water_material.roughness = 0.18
	water_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var water := MeshInstance3D.new()
	water.name = "VisibleWaterVolume"
	water.mesh = water_mesh
	water.material_override = water_material
	water.position.y = 0.20
	glass_root.add_child(water)

	var rim_mesh := TorusMesh.new()
	rim_mesh.inner_radius = 0.185
	rim_mesh.outer_radius = 0.205
	rim_mesh.rings = 28
	rim_mesh.ring_segments = 10
	_mesh(glass_root, rim_mesh, Color("dcebf2"), Vector3(0, 0.49, 0), "OpenGlassRim", 0.08, 0.20)
	var base_mesh := CylinderMesh.new()
	base_mesh.top_radius = 0.155
	base_mesh.bottom_radius = 0.155
	base_mesh.height = 0.025
	base_mesh.radial_segments = 32
	_mesh(glass_root, base_mesh, Color("c9dce5"), Vector3(0, 0.018, 0), "ThickGlassBase", 0.05, 0.22)
	return stand

static func _generic_station(parent: Node3D, position: Vector3, seed: String) -> Node3D:
	var stand := pedestal(parent, position)
	var colors: Array[Color] = [HubPalette.PINK, HubPalette.GREEN, HubPalette.GOLD, Color("7697d5"), Color("bd7655")]
	var index: int = absi(seed.hash()) % colors.size()
	var object := MeshInstance3D.new()
	object.mesh = Superegg.mesh(0.46, 0.78, 3.2)
	object.material_override = HubPalette.material(colors[index], 0.05, 0.5)
	object.position.y = 1.34
	stand.add_child(object)
	_box_collision(stand, Vector3(0.98, 0.82, 0.98), Vector3(0, 1.34, 0), "DisplayObjectSolidBody")
	return stand
