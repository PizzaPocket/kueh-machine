class_name HubUI
extends CanvasLayer

const MACHINE_FONT: Font = preload("res://assets/fonts/Syne-SemiBold.ttf")

var _prompt: PanelContainer
var _movement_hint: Control
var _movement_hint_dismissing := false
var _mobile_controls := false
var _joystick_outer: Panel
var _joystick_knob: Panel
var _joystick_touch := -2
const JOYSTICK_NO_TOUCH := -2
const JOYSTICK_OUTER_SIZE := 292.0
const JOYSTICK_KNOB_SIZE := 128.0
const MOBILE_ACTION_SIZE := 156.0
const MOBILE_CONTROL_MARGIN := 54.0
const MOBILE_ACTION_GAP := 24.0
# Maps each mobile action button (or desktop hint key) to the input action it
# drives. Joystick movement uses four continuously variable action strengths.
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
func _ready() -> void:
	layer = 20
	_build_prompt()
	_build_movement_hint()
	get_viewport().size_changed.connect(_update_prompt_width)
	_update_prompt_width()

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
## On mobile/tablet, per direct correction, even that shrunk-to-fit width
## was still wide enough to overlap the joystick and RUN/JUMP buttons in the
## screen's own corners -- 0 lets the PanelContainer fall back to hugging
## its Label's own natural text width instead, the same "sized to its own
## content" a normal button already is, rather than a wide bar.
## Font size also bumped to UIKit.MOBILE_BODY_FONT_SIZE on mobile/tablet to
## match dialog_ui.gd's own response/line text (see that file's own
## comment) -- previously stuck at the shared FONT_BUTTON/FONT_BODY (36)
## regardless of viewport, reading small next to everything else once those
## got their own mobile bump.
func _update_prompt_width() -> void:
	var label := _prompt.get_node("Label") as Label
	if UIKit.is_mobile_viewport(self):
		_prompt.custom_minimum_size.x = 0.0
		if label != null:
			label.add_theme_font_size_override("font_size", UIKit.MOBILE_BODY_FONT_SIZE)
	else:
		var viewport_width := get_viewport().get_visible_rect().size.x
		_prompt.custom_minimum_size.x = minf(PROMPT_WIDTH_DESKTOP, viewport_width - PROMPT_SIDE_MARGIN * 2.0)
		if label != null:
			label.remove_theme_font_size_override("font_size")

func _build_movement_hint() -> void:
	_mobile_controls = UIKit.is_mobile_viewport(self)
	if _mobile_controls:
		_build_mobile_controls()
	else:
		_build_desktop_movement_hint()

func _build_desktop_movement_hint() -> void:
	var key_size := 78.0
	var row_separation := 10
	_movement_hint = VBoxContainer.new()
	_movement_hint.name = "InitialMovementHint"
	(_movement_hint as VBoxContainer).add_theme_constant_override("separation", row_separation)
	_movement_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	UIKit.anchor_to_edge(_movement_hint, 0.0, 1.0, UITheme.SPACE_XL, UITheme.SPACE_XL)
	_movement_hint.visible = true
	_movement_hint.modulate.a = 1.0
	add_child(_movement_hint)

	# A full three-key row establishes the alignment width; CenterContainer
	# then places W directly over S, matching the physical keyboard cluster.
	# top_row/bottom_row themselves stay MOUSE_FILTER_IGNORE (pure layout
	# boxes) -- only the individual key panels need to receive input.
	var top_row := CenterContainer.new()
	top_row.custom_minimum_size.x = key_size * 3.0 + row_separation * 2.0
	top_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_row.add_child(_movement_key("W", "move_forward", key_size, UITheme.FONT_BODY))
	_movement_hint.add_child(top_row)

	var bottom_row := HBoxContainer.new()
	bottom_row.add_theme_constant_override("separation", row_separation)
	bottom_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.add_child(_movement_key("A", "move_left", key_size, UITheme.FONT_BODY))
	bottom_row.add_child(_movement_key("S", "move_back", key_size, UITheme.FONT_BODY))
	bottom_row.add_child(_movement_key("D", "move_right", key_size, UITheme.FONT_BODY))
	_movement_hint.add_child(bottom_row)

func _build_mobile_controls() -> void:
	_movement_hint = Control.new()
	_movement_hint.name = "MobileTraversalControls"
	_movement_hint.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_movement_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_movement_hint)

	_joystick_outer = Panel.new()
	_joystick_outer.name = "MovementJoystickOuter"
	_joystick_outer.custom_minimum_size = Vector2.ONE * JOYSTICK_OUTER_SIZE
	_joystick_outer.mouse_filter = Control.MOUSE_FILTER_STOP
	_joystick_outer.add_theme_stylebox_override("panel", _squircle_style(Color(0.16, 0.11, 0.07, 0.48), JOYSTICK_OUTER_SIZE))
	UIKit.anchor_to_edge(_joystick_outer, 0.0, 1.0, MOBILE_CONTROL_MARGIN, MOBILE_CONTROL_MARGIN)
	_movement_hint.add_child(_joystick_outer)

	_joystick_knob = Panel.new()
	_joystick_knob.name = "MovementJoystickKnob"
	_joystick_knob.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_joystick_knob.anchor_left = 0.5
	_joystick_knob.anchor_right = 0.5
	_joystick_knob.anchor_top = 0.5
	_joystick_knob.anchor_bottom = 0.5
	_joystick_knob.add_theme_stylebox_override("panel", _squircle_style(Color(0.97, 0.93, 0.85, 0.90), JOYSTICK_KNOB_SIZE))
	_set_joystick_knob_offset(Vector2.ZERO)
	_joystick_outer.add_child(_joystick_knob)

	var action_stack := VBoxContainer.new()
	action_stack.name = "MobileActionButtons"
	action_stack.add_theme_constant_override("separation", int(MOBILE_ACTION_GAP))
	action_stack.mouse_filter = Control.MOUSE_FILTER_IGNORE
	UIKit.anchor_to_edge(action_stack, 1.0, 1.0, MOBILE_CONTROL_MARGIN, MOBILE_CONTROL_MARGIN)
	action_stack.add_child(_movement_key("JUMP", "jump", MOBILE_ACTION_SIZE, UITheme.FONT_BUTTON))
	action_stack.add_child(_movement_key("RUN", "run", MOBILE_ACTION_SIZE, UITheme.FONT_BUTTON))
	_movement_hint.add_child(action_stack)

func _squircle_style(color: Color, size: float) -> SuperellipseStyleBox:
	var style := SuperellipseStyleBox.new()
	style.bg_color = color
	style.corner_radius = size
	style.corner_ratio = 0.34
	style.exponent = 4.0
	style.shadow_size = 5
	style.shadow_color = Color(0, 0, 0, 0.22)
	return style

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
	key.add_theme_stylebox_override("panel", _squircle_style(Color(0.16, 0.11, 0.07, 0.64), key_size))
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
			if _mobile_controls and _joystick_outer.get_global_rect().has_point(touch.position):
				_begin_joystick(touch.index, touch.position)
				get_viewport().set_input_as_handled()
			else:
				var key := _key_at_position(touch.position)
				if key != null:
					_press_touch(touch.index, key)
					get_viewport().set_input_as_handled()
		elif touch.index == _joystick_touch:
			_end_joystick()
			get_viewport().set_input_as_handled()
		elif _active_touches.has(touch.index):
			_release_touch(touch.index)
			get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag:
		var drag := event as InputEventScreenDrag
		if drag.index == _joystick_touch:
			_update_joystick(drag.position)
			get_viewport().set_input_as_handled()
		elif _active_touches.has(drag.index):
			_update_touch(drag.index, drag.position)
			get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton:
		var mouse_button := event as InputEventMouseButton
		if mouse_button.button_index == MOUSE_BUTTON_LEFT:
			if mouse_button.pressed:
				if _mobile_controls and _joystick_outer.get_global_rect().has_point(mouse_button.position):
					_begin_joystick(MOUSE_TOUCH_INDEX, mouse_button.position)
					get_viewport().set_input_as_handled()
				else:
					var key := _key_at_position(mouse_button.position)
					if key != null:
						_press_touch(MOUSE_TOUCH_INDEX, key)
						get_viewport().set_input_as_handled()
			elif _joystick_touch == MOUSE_TOUCH_INDEX:
				_end_joystick()
				get_viewport().set_input_as_handled()
			elif _active_touches.has(MOUSE_TOUCH_INDEX):
				_release_touch(MOUSE_TOUCH_INDEX)
				get_viewport().set_input_as_handled()
	elif event is InputEventMouseMotion:
		if _joystick_touch == MOUSE_TOUCH_INDEX:
			_update_joystick((event as InputEventMouseMotion).position)
			get_viewport().set_input_as_handled()
		elif _active_touches.has(MOUSE_TOUCH_INDEX):
			_update_touch(MOUSE_TOUCH_INDEX, (event as InputEventMouseMotion).position)
			get_viewport().set_input_as_handled()

func _begin_joystick(index: int, position: Vector2) -> void:
	if _joystick_touch != JOYSTICK_NO_TOUCH:
		return
	_joystick_touch = index
	_update_joystick(position)

func _update_joystick(position: Vector2) -> void:
	var center := _joystick_outer.get_global_rect().get_center()
	var radius := (JOYSTICK_OUTER_SIZE - JOYSTICK_KNOB_SIZE) * 0.5
	var offset := (position - center).limit_length(radius)
	_set_joystick_knob_offset(offset)
	var direction := offset / radius
	if direction.length() < 0.12:
		direction = Vector2.ZERO
	_set_action_strength("move_left", maxf(-direction.x, 0.0))
	_set_action_strength("move_right", maxf(direction.x, 0.0))
	_set_action_strength("move_forward", maxf(-direction.y, 0.0))
	_set_action_strength("move_back", maxf(direction.y, 0.0))

func _end_joystick() -> void:
	_joystick_touch = JOYSTICK_NO_TOUCH
	_set_joystick_knob_offset(Vector2.ZERO)
	for action in ["move_left", "move_right", "move_forward", "move_back"]:
		Input.action_release(action)

func _set_action_strength(action: StringName, strength: float) -> void:
	if strength > 0.0:
		Input.action_press(action, strength)
	else:
		Input.action_release(action)

func _set_joystick_knob_offset(offset: Vector2) -> void:
	var half := JOYSTICK_KNOB_SIZE * 0.5
	_joystick_knob.offset_left = -half + offset.x
	_joystick_knob.offset_right = half + offset.x
	_joystick_knob.offset_top = -half + offset.y
	_joystick_knob.offset_bottom = half + offset.y

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
	if _mobile_controls:
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

func set_prompt(visible: bool, text := "Talk (F)") -> void:
	if visible:
		UIKit.set_readout_text(_prompt, text)
	_prompt.visible = visible
