class_name HubUI
extends CanvasLayer

const MACHINE_FONT: Font = preload("res://assets/fonts/Syne-SemiBold.ttf")
const LOADING_WORDMARK: Texture2D = preload("res://assets/wordmark/loading-wordmark.svg")

var _loading: Control
var _loading_logo: Control
var _tip: Label
var _progress: ProgressBar
var _prompt: PanelContainer
var _movement_hint: VBoxContainer
var _movement_hint_dismissing := false
var _tip_index := 0
var _tip_elapsed := 0.0
var _loading_elapsed := 0.0
var _tips := [
	"WASD to move",
	"Hold Shift to run",
	"Space to jump",
	"Move the mouse to look around",
	"Press F when someone is nearby",
]

func _ready() -> void:
	layer = 20
	_build_loading()
	_build_prompt()
	_build_movement_hint()

func _process(delta: float) -> void:
	if _loading.visible:
		_loading_elapsed += delta
		_progress.value = minf(_loading_elapsed / 1.35, 1.0) * 100.0
		_tip_elapsed += delta
		if _tip_elapsed > 0.8:
			_tip_elapsed = 0.0
			_tip_index = (_tip_index + 1) % _tips.size()
			_tip.text = _tips[_tip_index]

func _build_loading() -> void:
	_loading = Control.new()
	_loading.name = "LoadingScreen"
	_loading.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(_loading)
	var background := ColorRect.new()
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.color = Color.WHITE
	_loading.add_child(background)
	var center_anchor := CenterContainer.new()
	center_anchor.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center_anchor.offset_left = 24
	center_anchor.offset_right = -24
	center_anchor.offset_top = 24
	center_anchor.offset_bottom = -24
	_loading.add_child(center_anchor)
	var center := VBoxContainer.new()
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.custom_minimum_size = Vector2(900, 0)
	center.add_theme_constant_override("separation", 36)
	center_anchor.add_child(center)
	_loading_logo = _build_logo_2d()
	center.add_child(_loading_logo)
	_progress = ProgressBar.new()
	_progress.custom_minimum_size = Vector2(540, 6)
	_progress.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_progress.show_percentage = false
	_progress.value = 0
	var track := StyleBoxFlat.new()
	track.bg_color = Color("4c5570")
	track.corner_radius_top_left = 2
	track.corner_radius_top_right = 2
	track.corner_radius_bottom_left = 2
	track.corner_radius_bottom_right = 2
	_progress.add_theme_stylebox_override("background", track)
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color("f7d774")
	fill.corner_radius_top_left = 2
	fill.corner_radius_top_right = 2
	fill.corner_radius_bottom_left = 2
	fill.corner_radius_bottom_right = 2
	_progress.add_theme_stylebox_override("fill", fill)
	center.add_child(_progress)

	# Controls are supporting information, anchored independently at the bottom
	# so they do not compete with the wordmark or loading state.
	var tip_anchor := CenterContainer.new()
	tip_anchor.name = "SubtleLoadingTipAnchor"
	tip_anchor.anchor_left = 0.0
	tip_anchor.anchor_right = 1.0
	tip_anchor.anchor_top = 1.0
	tip_anchor.anchor_bottom = 1.0
	tip_anchor.offset_top = -108.0
	tip_anchor.offset_bottom = -36.0
	tip_anchor.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_loading.add_child(tip_anchor)
	var tip_panel := PanelContainer.new()
	tip_panel.name = "LoadingActionPrompt"
	tip_panel.custom_minimum_size = Vector2(500, 0)
	tip_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var panel_style := SuperellipseStyleBox.new()
	panel_style.bg_color = Color(0.16, 0.11, 0.07, 0.55)
	panel_style.corner_radius = 96
	panel_style.corner_ratio = 0.46
	panel_style.exponent = 3.0
	panel_style.shadow_size = 5
	panel_style.shadow_color = Color(0, 0, 0, 0.22)
	panel_style.content_margin_left = 30
	panel_style.content_margin_right = 30
	panel_style.content_margin_top = 14
	panel_style.content_margin_bottom = 14
	tip_panel.add_theme_stylebox_override("panel", panel_style)
	tip_anchor.add_child(tip_panel)
	_tip = Label.new()
	_tip.text = _tips[0]
	_tip.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_tip.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_tip.add_theme_font_size_override("font_size", UITheme.FONT_CAPTION)
	_tip.add_theme_color_override("font_color", Color(0.97, 0.93, 0.85, 0.88))
	_tip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tip_panel.add_child(_tip)

func _build_logo_2d() -> Control:
	var logo := TextureRect.new()
	logo.texture = LOADING_WORDMARK
	logo.custom_minimum_size = Vector2(900, 191)
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	return logo

func _hero_background_material() -> ShaderMaterial:
	var shader := Shader.new()
	shader.code = """
shader_type canvas_item;
float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void fragment() {
	vec2 uv = UV;
	float grain = hash(floor(uv * vec2(1280.0, 720.0)));
	float vignette = 1.0 - smoothstep(0.18, 0.82, distance(uv, vec2(0.5)));
	// Kueh Machine's deep pandan green (#037031), with the same restrained
	// paper-like grain retained from the original loading treatment.
	vec3 base = vec3(0.012, 0.439, 0.192);
	base *= mix(0.93, 1.025, grain * 0.42 + vignette * 0.58);
	COLOR = vec4(base, 1.0);
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	return material

func _build_prompt() -> void:
	# Use the same construction, shared theme, type size, panel treatment, and
	# screen footprint as Eleblorb's bottom-center interaction readout. Keeping
	# this independent of DialogUI lets the dialog retain its corrected scale.
	_prompt = UIKit.backed_readout("Talk (F)", UITheme.TEXT_PRIMARY, UITheme.FONT_BUTTON)
	_prompt.name = "InteractionPrompt"
	_prompt.theme = UITheme.get_theme()
	_prompt.custom_minimum_size = Vector2(900, 0)
	_prompt.mouse_filter = Control.MOUSE_FILTER_IGNORE
	UIKit.anchor_to_edge(_prompt, 0.5, 1.0, 0.0, UITheme.SPACE_XL * 2)
	_prompt.visible = false
	add_child(_prompt)

func _build_movement_hint() -> void:
	_movement_hint = VBoxContainer.new()
	_movement_hint.name = "InitialMovementHint"
	_movement_hint.add_theme_constant_override("separation", 10)
	_movement_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	UIKit.anchor_to_edge(_movement_hint, 0.0, 1.0, UITheme.SPACE_XL, UITheme.SPACE_XL)
	_movement_hint.visible = false
	_movement_hint.modulate.a = 0.0
	add_child(_movement_hint)

	# A full three-key row establishes the alignment width; CenterContainer
	# then places W directly over S, matching the physical keyboard cluster.
	var top_row := CenterContainer.new()
	top_row.custom_minimum_size.x = 254
	top_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_row.add_child(_movement_key("W"))
	_movement_hint.add_child(top_row)

	var bottom_row := HBoxContainer.new()
	bottom_row.add_theme_constant_override("separation", 10)
	bottom_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for letter in ["A", "S", "D"]:
		bottom_row.add_child(_movement_key(letter))
	_movement_hint.add_child(bottom_row)

func _movement_key(letter: String) -> PanelContainer:
	var key := PanelContainer.new()
	key.custom_minimum_size = Vector2(78, 78)
	key.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := SuperellipseStyleBox.new()
	style.bg_color = Color(0.16, 0.11, 0.07, 0.64)
	style.corner_radius = 78
	style.corner_ratio = 0.34
	style.exponent = 3.0
	style.shadow_size = 5
	style.shadow_color = Color(0, 0, 0, 0.22)
	key.add_theme_stylebox_override("panel", style)
	var label := Label.new()
	label.text = letter
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", UITheme.FONT_BODY)
	label.add_theme_color_override("font_color", Color(0.97, 0.93, 0.85, 0.92))
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	key.add_child(label)
	return key

func _unhandled_input(event: InputEvent) -> void:
	if not _movement_hint.visible or _movement_hint_dismissing:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		var key_event := event as InputEventKey
		var movement_keys := [KEY_W, KEY_A, KEY_S, KEY_D]
		if key_event.keycode in movement_keys or key_event.physical_keycode in movement_keys:
			_movement_hint_dismissing = true
			var fade := create_tween()
			fade.set_trans(Tween.TRANS_QUAD)
			fade.set_ease(Tween.EASE_OUT)
			fade.tween_property(_movement_hint, "modulate:a", 0.0, 0.32)
			fade.tween_callback(func(): _movement_hint.visible = false)

func finish_loading() -> void:
	var tween := create_tween()
	tween.tween_property(_loading, "modulate:a", 0.0, 0.45)
	await tween.finished
	_loading.visible = false
	_movement_hint.visible = true
	var hint_reveal := create_tween()
	hint_reveal.set_trans(Tween.TRANS_QUAD)
	hint_reveal.set_ease(Tween.EASE_OUT)
	hint_reveal.tween_property(_movement_hint, "modulate:a", 1.0, 0.28)

func set_prompt(visible: bool) -> void:
	_prompt.visible = visible
