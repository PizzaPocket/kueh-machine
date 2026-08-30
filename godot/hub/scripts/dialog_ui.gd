extends CanvasLayer

## NPC speech, always routed through here rather than Hud.show_message --
## Hud's message line is reserved for system/transient feedback (bought an
## item, can't afford it), not character speech.
##
## Two modes: no actions (ordinary villager chatter) auto-dismisses after a
## few seconds and doesn't touch UIState, so movement/camera-look stay live
## for a caption that's meant to be glanced at, not a pause. With actions
## (the antique dealer's "Browse Wares") it becomes a real modal with a
## separate player-response window. UIState then owns gameplay input so the
## same stick/D-pad and X action used elsewhere can navigate and answer.

# 6.0, not the original 3.5 -- per direct correction, villager lines were
# disappearing before there was time to actually read them.
const AUTO_DISMISS_TIME := 6.0

## Godot has no declarative CSS-style media query, but the equivalent is this
## straightforward: check the viewport's own width at runtime (and again on
## every resize/orientation change) and branch the layout on it -- see
## UIKit.is_mobile_viewport() for the shared cutoff every responsive hub UI
## element uses. Below it the NPC line panel (anchored at 0.5, 0.90 --
## centered, near the bottom) and the response panel (anchored to the
## bottom-right corner) sit close enough vertically, on a narrow/portrait
## viewport, to overlap; above it there's enough spare width for both side
## by side as originally tuned.
##
## Per a further direct correction: moving the NPC panel's own vertical
## anchor up wasn't enough on its own -- neither panel's WIDTH was ever
## capped to the viewport, so the response panel (600px, anchored to the
## bottom-RIGHT corner, growing further right-to-left as anchor_h=1.0) could
## still extend past a narrow phone's left edge entirely regardless of the
## NPC panel's own position. _update_responsive_layout() below now also
## caps both panels' widths, and re-anchors the response panel to
## bottom-CENTER on mobile (not the corner) so a capped width can't overflow
## either edge.
const NPC_PANEL_ANCHOR_V_DESKTOP := 0.90
const NPC_PANEL_ANCHOR_V_MOBILE := 0.10
const NPC_PANEL_WIDTH_DESKTOP := 840.0
const RESPONSE_PANEL_WIDTH_DESKTOP := 600.0
const MOBILE_SIDE_MARGIN := 24.0
## Real touch targets, per direct correction that the response options
## weren't large enough to comfortably tap -- both bumped well past
## BUTTON_MIN_HEIGHT/FONT_BODY's own already-touch-friendly desktop values.
const RESPONSE_BUTTON_HEIGHT_MOBILE := 144.0
const RESPONSE_FONT_SIZE_MOBILE := 69

var _panel: PanelContainer
var _speaker_label: Label
var _line_label: Label
var _response_panel: PanelContainer
var _response_list: VBoxContainer
var _response_buttons: Array[Button] = []
var _is_modal: bool = false
var _auto_dismiss_timer: float = 0.0
var _opened_on_process_frame: int = -1
## Fires once, from _on_dismiss_pressed(), whenever the modal's dismiss
## response is chosen -- by its own button or by ui_cancel -- but NOT when
## an ordinary action callback closes the dialog itself (e.g. the vendor
## flow's "Let me see your wares."). Lets a caller like a wild blorb's join
## prompt tell "accepted" apart from "declined/cancelled" without the two
## paths silently colliding. Cleared as soon as it fires so it never
## double-runs.
var _dismiss_callback: Callable = Callable()


func _ready() -> void:
	layer = 30
	_build_ui()
	get_viewport().size_changed.connect(_update_responsive_layout)
	_update_responsive_layout()


func _build_ui() -> void:
	var shared_theme := UITheme.get_theme()

	_panel = UIKit.panel()
	_panel.theme = shared_theme
	_panel.custom_minimum_size = Vector2(NPC_PANEL_WIDTH_DESKTOP, 0)
	# PanelContainer defaults to MOUSE_FILTER_STOP, which swallows mouse
	# motion the instant the cursor position (still tracked even while
	# MOUSE_MODE_CAPTURED) falls over its rect -- silently blocking camera
	# look from ever reaching HubPlayer's _unhandled_input, regardless of
	# input_locked or mouse_mode. _panel is pure caption text with no
	# buttons in either dialog mode, so it should never intercept input.
	_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	# NPC speech remains horizontally centered in the lower half of the screen.
	# A dialog box sitting at
	# true screen-center covers up the main 3D view/gameplay behind it. The
	# earlier flush-against-the-bottom-edge layout (no margin at all) was
	# also wrong, just in the other direction -- anchoring at 75% down (not
	# 100%) with BEGIN growth (see UIKit.anchor_to_edge) keeps it low and
	# clear of the center while still growing upward, safely, as its own
	# content requires. Lowered another 15% of the viewport so speech sits in
	# the intended lower-screen caption zone without altering its scale.
	# The vertical anchor and width are both finalized by
	# _update_responsive_layout() right after _build_ui() returns (see
	# _ready()) -- this call just gives the panel a valid anchor/offset/grow
	# setup before then.
	UIKit.anchor_to_edge(_panel, 0.5, NPC_PANEL_ANCHOR_V_DESKTOP, 0.0, 0.0)
	_panel.visible = false
	add_child(_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", UITheme.SPACE_LG)
	margin.add_theme_constant_override("margin_right", UITheme.SPACE_LG)
	margin.add_theme_constant_override("margin_top", UITheme.SPACE_LG)
	margin.add_theme_constant_override("margin_bottom", UITheme.SPACE_LG)
	_panel.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", UITheme.SPACE_MD)
	margin.add_child(vbox)

	_speaker_label = UIKit.heading("")
	vbox.add_child(_speaker_label)

	vbox.add_child(UIKit.divider())

	_line_label = UIKit.body_label("")
	vbox.add_child(_line_label)

	_build_response_ui(shared_theme)


func _build_response_ui(shared_theme: Theme) -> void:
	_response_panel = UIKit.panel()
	_response_panel.theme = shared_theme
	_response_panel.custom_minimum_size = Vector2(RESPONSE_PANEL_WIDTH_DESKTOP, 0)
	# Anchor/width both finalized by _update_responsive_layout() right after
	# _build_ui() returns, same as _panel above -- this is just a valid
	# starting setup.
	UIKit.anchor_to_edge(
		_response_panel, 1.0, 1.0, UITheme.SPACE_XL, UITheme.SPACE_XL
	)
	_response_panel.visible = false
	add_child(_response_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", UITheme.SPACE_LG)
	margin.add_theme_constant_override("margin_right", UITheme.SPACE_LG)
	margin.add_theme_constant_override("margin_top", UITheme.SPACE_LG)
	margin.add_theme_constant_override("margin_bottom", UITheme.SPACE_LG)
	_response_panel.add_child(margin)

	var vbox := VBoxContainer.new()
	margin.add_child(vbox)

	_response_list = VBoxContainer.new()
	_response_list.add_theme_constant_override("separation", UITheme.SPACE_XS)
	vbox.add_child(_response_list)


## The actual "breakpoint": moves the NPC line panel higher (clearing the
## response panel's own vertical band) and caps both panels' widths to the
## live viewport so neither can overflow a narrow screen's edges. The
## response panel also re-anchors to bottom-center on mobile instead of the
## bottom-right corner -- a capped width still overflows the left edge from
## a corner anchor (grow_horizontal runs right-to-left there), but centered
## growth (BOTH directions) can't overflow either edge once actually capped.
func _update_responsive_layout() -> void:
	var is_mobile := UIKit.is_mobile_viewport(self)
	var viewport_width := get_viewport().get_visible_rect().size.x
	var capped_width := viewport_width - MOBILE_SIDE_MARGIN * 2.0

	var target_v := NPC_PANEL_ANCHOR_V_MOBILE if is_mobile else NPC_PANEL_ANCHOR_V_DESKTOP
	UIKit.anchor_to_edge(_panel, 0.5, target_v, 0.0, 0.0)
	_panel.custom_minimum_size.x = minf(NPC_PANEL_WIDTH_DESKTOP, capped_width)

	if is_mobile:
		UIKit.anchor_to_edge(_response_panel, 0.5, 1.0, 0.0, UITheme.SPACE_XL)
	else:
		UIKit.anchor_to_edge(_response_panel, 1.0, 1.0, UITheme.SPACE_XL, UITheme.SPACE_XL)
	_response_panel.custom_minimum_size.x = minf(RESPONSE_PANEL_WIDTH_DESKTOP, capped_width)


func _process(delta: float) -> void:
	if _is_modal and _response_panel.visible:
		UIKit.ensure_modal_focus(_response_panel, _response_buttons)
	if not _is_modal and _panel.visible:
		_auto_dismiss_timer -= delta
		if _auto_dismiss_timer <= 0.0:
			_on_dismiss_pressed()


func show_line(
	speaker: String, line: String, actions: Array[Dictionary] = [],
	dismiss_label: String = "Goodbye.", dismiss_callback: Callable = Callable()
) -> void:
	_opened_on_process_frame = Engine.get_process_frames()
	_speaker_label.text = speaker
	_line_label.text = line
	_dismiss_callback = dismiss_callback

	for c in _response_list.get_children():
		c.queue_free()
	_response_buttons.clear()

	var was_modal := _is_modal
	_is_modal = not actions.is_empty()
	if _is_modal:
		for action in actions:
			_add_response(action["label"], action["callback"])
		# Some conversations intentionally use their sole authored response as the
		# dismissal action, so an empty label suppresses the generic Goodbye row.
		if not dismiss_label.is_empty():
			_add_response(dismiss_label, _on_dismiss_pressed)
		_response_panel.visible = true
		if not was_modal:
			UIState.push_modal()
	else:
		_response_panel.visible = false
		if was_modal:
			UIState.pop_modal()
		_auto_dismiss_timer = AUTO_DISMISS_TIME

	_panel.visible = true
	if _is_modal and not _response_buttons.is_empty():
		_response_buttons[0].grab_focus.call_deferred()


func _add_response(text: String, callback: Callable) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", UITheme.SPACE_SM)
	_response_list.add_child(row)

	var option := UIKit.response_option(text, callback)
	if UIKit.is_mobile_viewport(self):
		option.custom_minimum_size.y = RESPONSE_BUTTON_HEIGHT_MOBILE
		option.add_theme_font_size_override("font_size", RESPONSE_FONT_SIZE_MOBILE)
	row.add_child(option)
	_response_buttons.append(option)

	var arrow := UIKit.response_arrow()
	# Keep the arrow control present even while unfocused: Containers exclude
	# hidden children from layout, which made the option text expand into this
	# margin and jump left/right whenever selection changed.
	arrow.modulate.a = 0.0
	row.add_child(arrow)
	option.focus_entered.connect(func(): arrow.modulate.a = 1.0)
	option.focus_exited.connect(func(): arrow.modulate.a = 0.0)
	option.mouse_entered.connect(option.grab_focus)


func _unhandled_input(event: InputEvent) -> void:
	if not _is_modal and _panel.visible and event.is_action_pressed("interact"):
		# As with response dialogs, do not let the F press that opened this line
		# immediately close it later in the same input dispatch.
		if Engine.get_process_frames() == _opened_on_process_frame:
			get_viewport().set_input_as_handled()
			return
		if event is InputEventKey and event.echo:
			return
		_on_dismiss_pressed()
		get_viewport().set_input_as_handled()
		return
	if _is_modal and _response_panel.visible and not _response_buttons.is_empty():
		if event.is_action_pressed("interact"):
			# The F press that asks HubPlayer to begin talking can reach this
			# CanvasLayer later in the same input dispatch, after show_line() has
			# already made the responses visible. Consume that opening press without
			# activating anything; only a later, deliberate F confirms a response.
			if Engine.get_process_frames() == _opened_on_process_frame:
				get_viewport().set_input_as_handled()
				return
			# F is the world's interaction key, so it also confirms the focused
			# response once a conversation owns input. This includes project links,
			# authored acknowledgements, and the ordinary dismissal response.
			if event is InputEventKey and event.echo:
				return
			var focused_response := get_viewport().gui_get_focus_owner() as Button
			if focused_response == null or not _response_buttons.has(focused_response):
				focused_response = _response_buttons[0]
			focused_response.emit_signal("pressed")
			get_viewport().set_input_as_handled()
			return
		var direction := 0
		if event.is_action_pressed("move_forward"):
			direction = -1
		elif event.is_action_pressed("move_back"):
			direction = 1
		if direction != 0:
			# Ignore held-key repeats so one deliberate W/S press advances one
			# response. Arrow keys and controller UI navigation remain native.
			if event is InputEventKey and event.echo:
				return
			var focused := get_viewport().gui_get_focus_owner()
			var current_index := _response_buttons.find(focused)
			if current_index < 0:
				current_index = 0 if direction < 0 else _response_buttons.size() - 1
			else:
				current_index = posmod(current_index + direction, _response_buttons.size())
			_response_buttons[current_index].grab_focus()
			get_viewport().set_input_as_handled()
			return
	if _panel.visible and event.is_action_pressed("ui_cancel"):
		_on_dismiss_pressed()
		get_viewport().set_input_as_handled()


## The one path that both the dismiss response button and ui_cancel route
## through, so a dismiss_callback fires exactly once regardless of which one
## the player used -- an action button's own callback (which may itself call
## hide_dialog()) never runs through here and so never triggers it.
func _on_dismiss_pressed() -> void:
	var callback := _dismiss_callback
	_dismiss_callback = Callable()
	hide_dialog()
	if callback.is_valid():
		callback.call()


func hide_dialog() -> void:
	if not _panel.visible:
		return
	_panel.visible = false
	_response_panel.visible = false
	if _is_modal:
		UIState.pop_modal()
		_is_modal = false
