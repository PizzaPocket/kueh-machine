class_name HubCatTail
extends RefCounted

const TAIL_RADIUS := 0.007
const TAIL_CAP_FRACTION := 0.0
const TAIL_FLATTEN_X := 0.65
const TAIL_DOME_STEPS := 4
const TAIL_DROOP_ANGLE := deg_to_rad(38.0)
const TAIL_PERK_ANGLE := deg_to_rad(24.0)
const TAIL_SWAY_YAW_RANGE := deg_to_rad(16.0)
const TAIL_BEND_EXPONENT := 1.6
const TAIL_ANIM_EASE_RATE := 1.4
const TAIL_ANIM_PITCH_HOLD_MIN := 1.0
const TAIL_ANIM_PITCH_HOLD_MAX := 3.2
const TAIL_ANIM_YAW_HOLD_MIN := 1.4
const TAIL_ANIM_YAW_HOLD_MAX := 3.8
const LIMB_RADIAL_SEGMENTS := 14
const RINGS_PER_SEGMENT := 6

## Direct port of MonkeyFigure's tail builder used by CatFigure.
static func build(parent: Node3D, color: Color, length_scale := 1.0, body_height := 0.2, body_radius := 0.1, radius_scale := 1.0) -> Dictionary:
	var tail_base_y := body_height * 0.25
	var anchor := Vector3(0, tail_base_y, -body_radius * 0.3)
	var base_points: Array[Vector3] = [
		anchor,
		anchor + (Vector3(0, tail_base_y, -body_radius * 1.2) - anchor) * length_scale,
		anchor + (Vector3(0, tail_base_y + 0.015, -body_radius * 2.5) - anchor) * length_scale,
		anchor + (Vector3(0, tail_base_y + 0.020, -body_radius * 3.4) - anchor) * length_scale,
	]
	var scaled_radius := TAIL_RADIUS * radius_scale
	var radii: Array[float] = [scaled_radius, scaled_radius, scaled_radius, scaled_radius]
	var mesh_instance := MeshInstance3D.new()
	mesh_instance.name = "Tail"
	mesh_instance.scale.x = TAIL_FLATTEN_X
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.6
	mesh_instance.material_override = material
	parent.add_child(mesh_instance)
	var state := {
		"mesh": mesh_instance, "base_points": base_points, "radii": radii,
		"radius_scale": radius_scale,
		"pitch_current": 0.0, "pitch_target": 0.0, "pitch_timer": 0.0,
		"yaw_current": 0.0, "yaw_target": 0.0, "yaw_timer": 0.0,
	}
	rebuild(state, 0.0)
	return state

## Direct port of MonkeyFigure's animated bend and rounded dome-cap rebuild.
static func rebuild(state: Dictionary, delta: float) -> void:
	state["pitch_timer"] = (state["pitch_timer"] as float) - delta
	if state["pitch_timer"] <= 0.0:
		state["pitch_target"] = randf_range(-TAIL_DROOP_ANGLE, TAIL_PERK_ANGLE)
		state["pitch_timer"] = randf_range(TAIL_ANIM_PITCH_HOLD_MIN, TAIL_ANIM_PITCH_HOLD_MAX)
	state["yaw_timer"] = (state["yaw_timer"] as float) - delta
	if state["yaw_timer"] <= 0.0:
		state["yaw_target"] = randf_range(-TAIL_SWAY_YAW_RANGE, TAIL_SWAY_YAW_RANGE)
		state["yaw_timer"] = randf_range(TAIL_ANIM_YAW_HOLD_MIN, TAIL_ANIM_YAW_HOLD_MAX)
	var ease := 1.0 - exp(-delta * TAIL_ANIM_EASE_RATE)
	state["pitch_current"] = lerpf(state["pitch_current"] as float, state["pitch_target"] as float, ease)
	state["yaw_current"] = lerpf(state["yaw_current"] as float, state["yaw_target"] as float, ease)
	var base_points: Array[Vector3] = state["base_points"]
	var anchor := base_points[0]
	var points: Array[Vector3] = []
	for index in base_points.size():
		var weight := pow(float(index) / float(base_points.size() - 1), TAIL_BEND_EXPONENT)
		var rotation := Basis(Vector3.UP, (state["yaw_current"] as float) * weight) * Basis(Vector3.RIGHT, (state["pitch_current"] as float) * weight)
		points.append(anchor + rotation * (base_points[index] - anchor))
	var radii: Array[float] = (state["radii"] as Array[float]).duplicate()
	var tip := points[points.size() - 1]
	var heading := (tip - points[points.size() - 2]).normalized()
	var dome_radius: float = TAIL_RADIUS * (state.get("radius_scale", 1.0) as float)
	for step in range(1, TAIL_DOME_STEPS + 1):
		var theta := (float(step) / TAIL_DOME_STEPS) * PI * 0.5
		points.append(tip + heading * (dome_radius * sin(theta)))
		radii.append(dome_radius * cos(theta))
	(state["mesh"] as MeshInstance3D).mesh = _build_limb_tube(points, radii, LIMB_RADIAL_SEGMENTS, RINGS_PER_SEGMENT, TAIL_CAP_FRACTION)

static func _build_limb_tube(control_points: Array[Vector3], control_radii: Array[float], radial_segments: int, rings_per_segment: int, cap_fraction: float) -> ArrayMesh:
	var count := control_points.size()
	var extended: Array[Vector3] = [control_points[0] * 2.0 - control_points[1]]
	extended.append_array(control_points)
	extended.append(control_points[count - 1] * 2.0 - control_points[count - 2])
	var total_rings := (count - 1) * rings_per_segment + 1
	var rings: Array = []
	var ring_index := 0
	var previous_tangent := Vector3.ZERO
	var previous_right := Vector3.ZERO
	var previous_up := Vector3.ZERO
	for segment_index in count - 1:
		var steps := rings_per_segment + 1 if segment_index == count - 2 else rings_per_segment
		for step in steps:
			var t := float(step) / rings_per_segment
			var position := _catmull_rom(extended[segment_index], extended[segment_index + 1], extended[segment_index + 2], extended[segment_index + 3], t)
			var tangent := _catmull_rom_tangent(extended[segment_index], extended[segment_index + 1], extended[segment_index + 2], extended[segment_index + 3], t)
			var radius := lerpf(control_radii[segment_index], control_radii[segment_index + 1], t)
			radius *= _cap_taper(float(ring_index) / float(total_rings - 1), cap_fraction)
			var right: Vector3
			var up: Vector3
			if ring_index == 0:
				var first_basis := _ring_basis(tangent)
				right = first_basis.x
				up = first_basis.y
			else:
				var frame := _transport_frame(previous_tangent, previous_right, previous_up, tangent)
				right = frame[0]
				up = frame[1]
			rings.append(_build_ring(position, right, up, radius, radial_segments))
			previous_tangent = tangent
			previous_right = right
			previous_up = up
			ring_index += 1
	return _mesh_from_rings(rings)

static func _catmull_rom(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: float) -> Vector3:
	var t2 := t * t
	var t3 := t2 * t
	return 0.5 * ((2.0 * p1) + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3)

static func _catmull_rom_tangent(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: float) -> Vector3:
	var tangent := 0.5 * ((-p0 + p2) + 2.0 * (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t + 3.0 * (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t)
	return (p2 - p1).normalized() if tangent.length() < 0.0001 else tangent.normalized()

static func _cap_taper(u: float, fraction: float) -> float:
	if fraction <= 0.0: return 1.0
	if u < fraction: return sin((u / fraction) * PI * 0.5)
	if u > 1.0 - fraction: return sin(((1.0 - u) / fraction) * PI * 0.5)
	return 1.0

static func _ring_basis(tangent: Vector3) -> Basis:
	var reference := Vector3.FORWARD if absf(tangent.dot(Vector3.UP)) > 0.9 else Vector3.UP
	var right := tangent.cross(reference).normalized()
	return Basis(right, right.cross(tangent).normalized(), tangent)

static func _transport_frame(previous_tangent: Vector3, previous_right: Vector3, previous_up: Vector3, tangent: Vector3) -> Array[Vector3]:
	var axis := previous_tangent.cross(tangent)
	if axis.length() < 0.0001: return [previous_right, previous_up]
	axis = axis.normalized()
	var rotated_right := Basis(axis, acos(clampf(previous_tangent.dot(tangent), -1.0, 1.0))) * previous_right
	rotated_right = (rotated_right - tangent * rotated_right.dot(tangent)).normalized()
	return [rotated_right, rotated_right.cross(tangent).normalized()]

static func _build_ring(center: Vector3, right: Vector3, up: Vector3, radius: float, segments: int) -> Array[Vector3]:
	var points: Array[Vector3] = []
	for segment_index in segments:
		var angle := float(segment_index) / segments * TAU
		points.append(center + right * cos(angle) * radius + up * sin(angle) * radius)
	return points

static func _mesh_from_rings(rings: Array) -> ArrayMesh:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for ring_index in rings.size() - 1:
		var first: Array = rings[ring_index]
		var second: Array = rings[ring_index + 1]
		for segment_index in first.size():
			var next := (segment_index + 1) % first.size()
			for point in [first[segment_index], second[segment_index], first[next], first[next], second[segment_index], second[next]]:
				surface.add_vertex(point)
	surface.generate_normals()
	return surface.commit()
