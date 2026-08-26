class_name FigureBuilder
extends RefCounted

## Adapter around Eleblorb's canonical ProceduralFigure. This file contains
## no replacement body geometry; it only maps hub appearance data to the rig.
static func build(parent: Node3D, spec: Dictionary, _player := false) -> Dictionary:
	var hair_style: String = spec.get("hair_style", FigureHair.STYLE_BUZZCUT)
	var hair_length_variance: float = spec.get("hair_length_variance", 0.0)
	if hair_style == "flattop":
		hair_style = FigureHair.STYLE_FLAT_TOP
	elif hair_style == "flattop_low":
		hair_style = FigureHair.STYLE_FLAT_TOP_LOW
	elif hair_style in ["full_long", "very_long_full"]:
		if not spec.has("hair_length_variance"):
			hair_length_variance = 0.24 if hair_style == "very_long_full" else 0.15
		hair_style = FigureHair.STYLE_LONG_EXTRA_FULL if hair_style == "very_long_full" else FigureHair.STYLE_LONG_FULL
	elif hair_style in ["very_long", "long", "medium_long", "shoulder", "less_shoulder"]:
		if not spec.has("hair_length_variance"):
			hair_length_variance = {
				"very_long": 0.24,
				"long": 0.15,
				"medium_long": 0.10,
				"shoulder": 0.06,
				"less_shoulder": 0.02,
			}.get(hair_style, 0.0)
		hair_style = FigureHair.STYLE_LONG
	var build_scale: float = spec.get("build_scale", 1.0)
	var sleeve_style: String = spec.get("sleeve_style", ProceduralFigure.SLEEVE_STYLE_NONE if spec.get("sleeveless", false) else ProceduralFigure.SLEEVE_STYLE_LONG)
	if spec.get("is_female", true) and sleeve_style == ProceduralFigure.SLEEVE_STYLE_SHORT:
		sleeve_style = ProceduralFigure.SLEEVE_STYLE_COLORED_UPPER_ARM
	var wears_dress: bool = spec.get("dress", false)
	var leg_color: Color = spec.get("skin", ProceduralFigure.SKIN_COLOR) if wears_dress else spec.get("bottom", ProceduralFigure.SKIN_COLOR)
	var pivots := ProceduralFigure.build(
		parent,
		spec.get("skin", ProceduralFigure.SKIN_COLOR),
		spec.get("top", ProceduralFigure.SKIN_COLOR),
		leg_color,
		sleeve_style,
		spec.get("height_scale", 1.0),
		spec.get("chest_build_scale", build_scale),
		spec.get("hip_build_scale", build_scale),
		spec.get("abdomen_width_scale", build_scale),
		Color(0, 0, 0, 0),
		spec.get("hair", FigureHair.DEFAULT_HAIR_COLOR),
		hair_style,
		hair_length_variance,
		spec.get("shoes", spec.get("bottom", Color.WHITE)),
		false,
		spec.get("glasses", false),
		spec.get("round_glasses", false),
		_player or spec.get("abdomen_matches_hips", false),
		0.72 if wears_dress else 1.0,
		spec.get("upper_arm_thickness", 1.0),
		spec.get("shirt_texture"),
		spec.get("is_female", true)
	)
	pivots["root"] = parent.get_child(parent.get_child_count() - 1)
	pivots["arms"] = [pivots["arm_left"], pivots["arm_right"]]
	pivots["legs"] = [pivots["leg_left"], pivots["leg_right"]]
	if spec.get("glasses_on_hair", false):
		var glasses := (pivots["root"] as Node).find_child("Glasses", true, false) as Node3D
		if glasses != null:
			# Rest the frames above the face, pitched back against the front of
			# the hairstyle, rather than leaving them over the figure's eyes.
			# At this height the lower rim clears the long-hair shell by roughly
			# one centimetre; the former 0.17 m lift visibly floated above it.
			glasses.position.y += 0.12
			glasses.position.z -= 0.02
			glasses.rotation.x = deg_to_rad(-22.0)
	if wears_dress:
		var hips: MeshInstance3D = pivots["hips"]
		FigureDress.add_to_figure(pivots["root"], hips, spec.get("bottom", Color.WHITE), spec.get("hip_build_scale", build_scale))
	return pivots
