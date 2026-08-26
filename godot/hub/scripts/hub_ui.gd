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
# Doubles the WASD hint as real touch controls, per direct instruction: the
# hint should only disappear on an actual keyboard press (see
# _unhandled_input's own InputEventKey check below, left untouched), so a
# touch/mouse user gets persistent on-screen movement buttons instead of
# ever losing them. Maps each key Control to the movement action it drives.
var _key_actions: Dictionary = {}
# Which pointer (a real touch's own event.index, or MOUSE_TOUCH_INDEX for a
# mouse button) currently "owns" which key Control -- lets a drag slide
# between adjacent keys (e.g. W -> D for a diagonal) update the pressed
# action instead of only ever supporting a single static tap.
var _active_touches: Dictionary = {}
const MOUSE_TOUCH_INDEX := -1
# _prompt's own designed width on a normal desktop viewport; _update_prompt_
# width() below never grows it past this, only shrinks it to fit a narrower
# screen.
const PROMPT_WIDTH_DESKTOP := 900.0
const PROMPT_SIDE_MARGIN := 32.0
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
	get_viewport().size_changed.connect(_update_prompt_width)
	_update_prompt_width()

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
	_prompt.custom_minimum_size = Vector2(PROMPT_WIDTH_DESKTOP, 0)
	# backed_readout() is a plain (non-interactive by design -- it also backs
	# passive HUD stat displays elsewhere) PanelContainer; STOP here plus the
	# gui_input connection below is what turns THIS particular instance into
	# a real tappable control, since a touch/mouse user has no physical F key
	# to press instead.
	_prompt.mouse_filter = Control.MOUSE_FILTER_STOP
	_prompt.gui_input.connect(_on_prompt_gui_input)
	UIKit.anchor_to_edge(_prompt, 0.5, 1.0, 0.0, UITheme.SPACE_XL * 2)
	_prompt.visible = false
	add_child(_prompt)

## Fires the same "interact" action a physical F key press would, via a real
## InputEventAction parsed through the normal input pipeline -- hub_player.gd
## and dialog_ui.gd both key off event.is_action_pressed("interact") in their
## own _unhandled_input, an event-driven check that Input.action_press()
## alone does NOT satisfy (that only updates polling state like
## is_action_pressed(), the mechanism the WASD movement buttons above rely
## on instead -- interact needs the actual event).
func _on_prompt_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mouse_button := event as InputEventMouseButton
		if not (mouse_button.pressed and mouse_button.button_index == MOUSE_BUTTON_LEFT):
			return
	elif event is InputEventScreenTouch:
		if not (event as InputEventScreenTouch).pressed:
			return
	else:
		return
	var action_event := InputEventAction.new()
	action_event.action = "interact"
	action_event.pressed = true
	Input.parse_input_event(action_event)
	get_viewport().set_input_as_handled()

## _prompt's width never grows past PROMPT_WIDTH_DESKTOP, only shrinks to
## fit a viewport narrower than that (plus side margins) -- so it's already
## the right width on a normal desktop window and never overflows a phone's.
func _update_prompt_width() -> void:
	var viewport_width := get_viewport().get_visible_rect().size.x
	_prompt.custom_minimum_size.x = minf(PROMPT_WIDTH_DESKTOP, viewport_width - PROMPT_SIDE_MARGIN * 2.0)

func _build_movement_hint() -> void:
	# Per direct correction: the hint doubles as real touch controls on
	# mobile (see _input() below), so it needs to actually read as
	# comfortably tappable there, not just legible -- doubled key size,
	# font, and spacing, computed once here rather than re-derived live on
	# resize (unlike the plain single-property updates elsewhere in this
	# file, redoing this nested multi-row layout live isn't worth the
	# complexity for what's essentially a startup-only hint).
	var is_mobile := UIKit.is_mobile_viewport(self)
	var key_size := 156.0 if is_mobile else 78.0
	var key_font_size := UITheme.FONT_BODY * 2 if is_mobile else UITheme.FONT_BODY
	var row_separation := 20 if is_mobile else 10
	var edge_margin: float = UITheme.SPACE_XL * (2.0 if is_mobile else 1.0)

	_movement_hint = VBoxContainer.new()
	_movement_hint.name = "InitialMovementHint"
	_movement_hint.add_theme_constant_override("separation", row_separation)
	_movement_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	UIKit.anchor_to_edge(_movement_hint, 0.0, 1.0, edge_margin, edge_margin)
	_movement_hint.visible = false
	_movement_hint.modulate.a = 0.0
	add_child(_movement_hint)

	# A full three-key row establishes the alignment width; CenterContainer
	# then places W directly over S, matching the physical keyboard cluster.
	# top_row/bottom_row themselves stay MOUSE_FILTER_IGNORE (pure layout
	# boxes) -- only the individual key panels need to receive input.
	var top_row := CenterContainer.new()
	top_row.custom_minimum_size.x = key_size * 3.0 + row_separation * 2.0
	top_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_row.add_child(_movement_key("W", "move_forward", key_size, key_font_size))
	_movement_hint.add_child(top_row)

	var bottom_row := HBoxContainer.new()
	bottom_row.add_theme_constant_override("separation", row_separation)
	bottom_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.add_child(_movement_key("A", "move_left", key_size, key_font_size))
	bottom_row.add_child(_movement_key("S", "move_back", key_size, key_font_size))
	bottom_row.add_child(_movement_key("D", "move_right", key_size, key_font_size))
	_movement_hint.add_child(bottom_row)

func _movement_key(letter: String, action: String, key_size: float, font_size: int) -> PanelContainer:
	var key := PanelContainer.new()
	key.custom_minimum_size = Vector2(key_size, key_size)
	# STOP (not the surrounding rows' IGNORE) so this panel's own
	# get_global_rect() is a meaningful hit-test target in _input() below --
	# the actual press/release is driven from there, not a gui_input signal,
	# since a Control's own input only ever tracks one pointer at a time
	# (touch is emulated through a single synthetic mouse), which would
	# silently drop a second simultaneous finger on a different key (e.g.
	# forward+strafe held together for a diagonal).
	key.mouse_filter = Control.MOUSE_FILTER_STOP
	_key_actions[key] = action
	var style := SuperellipseStyleBox.new()
	style.bg_color = Color(0.16, 0.11, 0.07, 0.64)
	style.corner_radius = key_size
	style.corner_ratio = 0.34
	style.exponent = 3.0
	style.shadow_size = 5
	style.shadow_color = Color(0, 0, 0, 0.22)
	key.add_theme_stylebox_override("panel", style)
	var label := Label.new()
	label.text = letter
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color(0.97, 0.93, 0.85, 0.92))
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	key.add_child(label)
	return key

## Real per-finger hit-testing against the WASD panels, in _input() (not a
## gui_input signal) so a second simultaneous touch on a different key is
## never silently swallowed -- see _movement_key()'s own comment on why a
## Control's single-pointer mouse emulation isn't enough here. Runs ahead of
## hub_player.gd's own _unhandled_input, and explicitly marks only the
## events that actually land on a key as handled, so a drag starting
## anywhere else on screen still reaches hub_player.gd for camera look.
func _input(event: InputEvent) -> void:
	if not _movement_hint.visible or _movement_hint_dismissing:
		return
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			var key := _key_at_position(touch.position)
			if key != null:
				_press_touch(touch.index, key)
				get_viewport().set_input_as_handled()
		elif _active_touches.has(touch.index):
			_release_touch(touch.index)
			get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag:
		var drag := event as InputEventScreenDrag
		if _active_touches.has(drag.index):
			_update_touch(drag.index, drag.position)
			get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton:
		var mouse_button := event as InputEventMouseButton
		if mouse_button.button_index == MOUSE_BUTTON_LEFT:
			if mouse_button.pressed:
				var key := _key_at_position(mouse_button.position)
				if key != null:
					_press_touch(MOUSE_TOUCH_INDEX, key)
					get_viewport().set_input_as_handled()
			elif _active_touches.has(MOUSE_TOUCH_INDEX):
				_release_touch(MOUSE_TOUCH_INDEX)
				get_viewport().set_input_as_handled()
	elif event is InputEventMouseMotion and _active_touches.has(MOUSE_TOUCH_INDEX):
		_update_touch(MOUSE_TOUCH_INDEX, (event as InputEventMouseMotion).position)
		get_viewport().set_input_as_handled()

func _key_at_position(pos: Vector2) -> Control:
	for key in _key_actions:
		if (key as Control).get_global_rect().has_point(pos):
			return key
	return null

func _press_touch(index: int, key: Control) -> void:
	Input.action_press(_key_actions[key])
	_active_touches[index] = key

func _release_touch(index: int) -> void:
	var key: Control = _active_touches[index]
	Input.action_release(_key_actions[key])
	_active_touches.erase(index)

## A drag sliding from one key onto an adjacent one (e.g. W -> D for a
## diagonal) swaps which action is held; sliding off all keys just releases
## and stops tracking that pointer (per _key_at_position's own doc, it does
## not resume if the same finger drags back onto a key afterward).
func _update_touch(index: int, pos: Vector2) -> void:
	var current: Control = _active_touches[index]
	if (current as Control).get_global_rect().has_point(pos):
		return
	Input.action_release(_key_actions[current])
	var next := _key_at_position(pos)
	if next != null:
		_press_touch(index, next)
	else:
		_active_touches.erase(index)

func _unhandled_input(event: InputEvent) -> void:
	if not _movement_hint.visible or _movement_hint_dismissing:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		var key_event := event as InputEventKey
		var movement_keys := [KEY_W, KEY_A, KEY_S, KEY_D]
		if key_event.keycode in movement_keys or key_event.physical_keycode in movement_keys:
			_movement_hint_dismissing = true
			# A finger/mouse button already held down on a key when the keyboard
			# dismisses the hint would otherwise never get its release event
			# processed (once dismissed, _input() above ignores everything) and
			# leave that movement action stuck pressed forever.
			for index in _active_touches.keys():
				Input.action_release(_key_actions[_active_touches[index]])
			_active_touches.clear()
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
