class_name FigureDress
extends RefCounted

## Reusable knee-covering dress for the canonical ProceduralFigure rig.
## The hips remain the garment color, while both articulated leg chains are
## built separately in skin color by the caller. The skirt is one superegg:
## circularly rounded at the waist/crown and deliberately flat at the hem.

const SKIRT_HALF_WIDTH := 0.255
const SKIRT_HALF_DEPTH := 0.185
const SKIRT_HALF_HEIGHT := 0.36
const HIP_TOP_OVERLAP := 0.13
const ROUND_CROWN_EPSILON := 2.0
const SHARP_HEM_EPSILON := 8.0


static func add_to_figure(
	_rig: Node3D,
	hips: MeshInstance3D,
	dress_color: Color,
	hip_build_scale: float = 1.0
) -> MeshInstance3D:
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
	# Hips' origin is their center. This places the rounded crown slightly
	# above the hip center and the hem below the knee pivots, while parenting
	# the garment to the pelvis so a contrapposto hip drop carries the skirt.
	skirt.position = Vector3(0, HIP_TOP_OVERLAP - SKIRT_HALF_HEIGHT, 0)
	hips.add_child(skirt)
	return skirt


static func _recolor_hips(hips: MeshInstance3D, dress_color: Color) -> void:
	var material := StandardMaterial3D.new()
	material.albedo_color = dress_color
	material.roughness = 0.6
	hips.set_surface_override_material(0, material)
