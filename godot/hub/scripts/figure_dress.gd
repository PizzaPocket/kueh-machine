class_name FigureDress
extends RefCounted

## Reusable knee-covering dress for the canonical ProceduralFigure rig.
## The hips remain the garment color, while both articulated leg chains are
## built separately in skin color by the caller. The skirt is one superegg:
## circularly rounded at the waist/crown and deliberately flat at the hem.

# A few cm past the hips' own actual (grown) visual size on every side, per
# direct correction, rather than an independently-tuned constant that could
# drift out of sync with it -- ProceduralFigure.HIP_SIZE plus its own
# HIP_VISUAL_GROWTH margin is the hips mesh's real half-extent; this adds
# the same further margin on top of that for the garment worn over it.
const SKIRT_PAST_HIPS_MARGIN := 0.03
const SKIRT_HALF_WIDTH := 0.17 + 0.025 + SKIRT_PAST_HIPS_MARGIN
const SKIRT_HALF_DEPTH := 0.11 + 0.025 + SKIRT_PAST_HIPS_MARGIN
const HIP_TOP_OVERLAP := 0.13
# Raised another 3cm per direct correction -- shifts the whole garment (and
# so its hem) up without changing its height or shape.
const SKIRT_RAISE := 0.08
# The skirt's top is lowered by this much (hem held fixed), exposing more of
# the hips segment above it -- see ProceduralFigure's own hip epsilon_top,
# rounded to look intentional now that more of it shows. Lowered a further
# 5cm (was 0.08), then another 8cm per direct correction.
const SKIRT_TOP_LOWER := 0.25
const SKIRT_HALF_HEIGHT := 0.36 - SKIRT_TOP_LOWER * 0.5
const ROUND_CROWN_EPSILON := 2.0
const SHARP_HEM_EPSILON := 8.0
const STRIDE_LEG_CLEARANCE := 0.055
const STRIDE_WIDTH_UTILIZATION := 0.82
const STRIDE_MIN_WIDTH_SCALE := 0.78


static func add_to_figure(
	_rig: Node3D,
	hips: MeshInstance3D,
	dress_color: Color,
	hip_build_scale: float = 1.0
) -> Dictionary:
	_recolor_hips(hips, dress_color)
	var skirt := SuperEgg.build_part(
		Vector3(
			SKIRT_HALF_WIDTH * hip_build_scale,
			SKIRT_HALF_HEIGHT,
			SKIRT_HALF_DEPTH * hip_build_scale
		),
		dress_color,
		ROUND_CROWN_EPSILON,
		SHARP_HEM_EPSILON
	)
	skirt.name = "SupereggDressSkirt"
	# Hips' origin is their center. Seat the rounded crown five centimetres
	# higher on the hips while keeping the garment parented to the pelvis, so
	# any resting-pose movement still carries the whole skirt cleanly. The
	# extra -SKIRT_TOP_LOWER keeps the hem exactly where it was before that
	# constant existed, moving only the top down.
	var resting_hips_y := HIP_TOP_OVERLAP - SKIRT_HALF_HEIGHT + SKIRT_RAISE - SKIRT_TOP_LOWER
	# Hinge at the crown's actual upper edge. The exposed upper-skirt changes
	# mean this no longer coincides with the leg sockets; using the sockets as
	# the pivot made the crown slide backward in an arc during a jump.
	var skirt_bounds := skirt.mesh.get_aabb()
	var skirt_top_y := resting_hips_y + skirt_bounds.position.y + skirt_bounds.size.y
	var pitch_pivot := Node3D.new()
	pitch_pivot.name = "DressJumpPitchPivot"
	pitch_pivot.position.y = skirt_top_y
	hips.add_child(pitch_pivot)
	skirt.position = Vector3(0, resting_hips_y - skirt_top_y, 0)
	pitch_pivot.add_child(skirt)
	return {"skirt": skirt, "pitch_pivot": pitch_pivot}


static func _recolor_hips(hips: MeshInstance3D, dress_color: Color) -> void:
	var material := StandardMaterial3D.new()
	material.albedo_color = dress_color
	material.roughness = 0.6
	hips.set_surface_override_material(0, material)


## Solve the smallest rotated lower-skirt envelope that contains both animated
## hip-to-knee endpoints. The skirt's equatorial section is an ellipse
## (ROUND_CROWN_EPSILON == 2), so depth is solved from
## (x / a)^2 + (z / b)^2 <= 1 after choosing a restrained width scale.
## Reading the live knee transforms makes the same calculation valid for walk
## and run gaits without separate hand-tuned flare amounts.
static func stride_envelope(
	skirt: MeshInstance3D,
	hips: Node3D,
	knee_left: Node3D,
	knee_right: Node3D
) -> Dictionary:
	# Measure in the rig's unscaled frame so fitting the upper skirt does not
	# feed its previous frame's transform back into this lower-skirt solve.
	var rig := hips.get_parent() as Node3D
	var left_3d := rig.to_local(knee_left.global_position) - hips.position
	var right_3d := rig.to_local(knee_right.global_position) - hips.position
	return _envelope_for_points(skirt, [Vector2(left_3d.x, left_3d.z), Vector2(right_3d.x, right_3d.z)])


## Fit the dress-coloured hip shell at its lower edge. Each animated upper leg
## is treated as the line from its hip socket to its knee; intersecting that
## line with the shell's hem plane gives the exact two-point stride box at the
## height this segment actually has to cover.
static func upper_skirt_envelope(
	hips: MeshInstance3D,
	leg_left: Node3D,
	leg_right: Node3D,
	knee_left: Node3D,
	knee_right: Node3D
) -> Dictionary:
	var rig := hips.get_parent() as Node3D
	var hem_y := hips.position.y + hips.mesh.get_aabb().position.y
	var points: Array[Vector2] = []
	for pair in [[leg_left, knee_left], [leg_right, knee_right]]:
		var top := rig.to_local((pair[0] as Node3D).global_position)
		var knee := rig.to_local((pair[1] as Node3D).global_position)
		var denominator := knee.y - top.y
		var fraction := clampf((hem_y - top.y) / denominator, 0.0, 1.0) if absf(denominator) > 0.0001 else 0.0
		var sample := top.lerp(knee, fraction) - hips.position
		points.append(Vector2(sample.x, sample.z))
	return _envelope_for_points(hips, points)


static func _envelope_for_points(part: MeshInstance3D, points: Array[Vector2]) -> Dictionary:
	var left := points[0]
	var right := points[1]
	var leading := left if left.y >= right.y else right
	# Local +Z is the garment front. Aim it directly at the leading corner of
	# the two-leg stride box rather than approximating that diagonal by phase.
	# If neither leg actually leads, there is no diagonal: choosing the left or
	# right point merely because of a tie rolled the skirt sideways during the
	# player's initial settling drop before they had moved.
	var yaw := 0.0 if absf(left.y - right.y) < 0.01 else atan2(leading.x, leading.y)
	var inverse_yaw := -yaw
	var rotated_points: Array[Vector2] = []
	for point in [left, right]:
		var rotated := Vector3(point.x, 0.0, point.y).rotated(Vector3.UP, inverse_yaw)
		rotated_points.append(Vector2(rotated.x, rotated.z))

	var bounds := part.mesh.get_aabb()
	var half_width := maxf(bounds.size.x * 0.5, 0.001)
	var half_depth := maxf(bounds.size.z * 0.5, 0.001)
	var required_x := 0.0
	for point in rotated_points:
		required_x = maxf(required_x, absf(point.x) + STRIDE_LEG_CLEARANCE)
	# Leave some width headroom so the elliptical corner still has depth
	# available; fitting X exactly to its axis would mathematically force Z
	# toward infinity at that point.
	var width_scale := maxf(STRIDE_MIN_WIDTH_SCALE, required_x / (half_width * STRIDE_WIDTH_UTILIZATION))
	var depth_scale := 1.0
	for point in rotated_points:
		var x_ratio := clampf((absf(point.x) + STRIDE_LEG_CLEARANCE) / (half_width * width_scale), 0.0, 0.98)
		var available_z_fraction := sqrt(maxf(1.0 - x_ratio * x_ratio, 0.04))
		var required_depth := (absf(point.y) + STRIDE_LEG_CLEARANCE) / (half_depth * available_z_fraction)
		depth_scale = maxf(depth_scale, required_depth)
	return {"yaw": yaw, "scale_x": width_scale, "scale_z": depth_scale}
