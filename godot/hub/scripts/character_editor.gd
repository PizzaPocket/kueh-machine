class_name CharacterEditor
extends CanvasLayer

signal closed
signal appearance_saved(saved_appearance: Dictionary)

const SKIN_SWATCHES := ["f3cfb8", "d9a47e", "b97850", "8c5537", "5d3527", "362019"]
const HAIR_SWATCHES := ["171311", "3f2a20", "6a4632", "a66d45", "d2aa63", "b86543"]
# Chromatic colors follow the hue wheel, followed by the neutral clothing
# colors. The shared hues match the account-badge avatar palette exactly
# (shared/account-widget.js's AVATAR_COLORS) where a swatch is shared with it.
# c0392b replaces the old chocolate-brown swatch (5b3a29) per direct
# instruction -- its hue sits slightly earlier on the wheel than d97b66's
# coral (~6 deg vs ~11 deg), so it leads the chromatic run rather than
# following it, keeping the hue-wheel ordering intact.
const CLOTH_SWATCHES := ["c0392b", "d97b66", "f0b429", "8fbf7f", "8bb4d6", "287fc2", "18283f", "f2b8c6", "fbf6ec", "777a7c", "191919"]
const HAIR_STYLES := [
	{"label": "Buzz cut", "value": "buzzcut"},
	{"label": "Hero crop", "value": "hero"},
	{"label": "Afro", "value": "afro"},
	{"label": "Flattop", "value": "flattop"},
	{"label": "Bob", "value": "less_shoulder"},
	{"label": "Long", "value": "full_long"},
	{"label": "Long 2", "value": "very_long_full"},
	{"label": "Bun", "value": "bun"},
	{"label": "Ponytail", "value": "ponytail_short"},
	{"label": "Ponytail 2", "value": "ponytail_long"},
]
# The three Build presets' full field sets. Exposed as a const (not inline in
# _apply_body_preset() below) so other modules constructing appearance data
# outside the live editor -- hub_main.gd's authored contributor look-ups, for
# instance -- can reuse the exact same numbers instead of duplicating them.
const BODY_PRESETS := {
	# Samantha's authored proportions: a restrained thorax, fuller hips, and
	# the female construction rules that prevent a bulky chest.
	"soft": {
		"build_scale": 1.13, "chest_build_scale": 0.94,
		"hip_build_scale": 1.13, "abdomen_width_scale": 1.08,
		"abdomen_matches_hips": false, "is_female": true,
	},
	"broad": {
		"build_scale": 1.10, "chest_build_scale": 1.10,
		"hip_build_scale": 1.04, "abdomen_width_scale": 1.04,
		"abdomen_matches_hips": true, "is_female": false,
	},
	# Bring the thorax close to the abdomen/hip width. Shoulder pivots derive
	# from this resolved chest size, so the arms follow inward.
	"slim": {
		"build_scale": 0.96, "chest_build_scale": 0.92,
		"hip_build_scale": 1.0, "abdomen_width_scale": 1.0,
		"abdomen_matches_hips": true, "is_female": false,
	},
}

## Content scaled up 33% on mobile/touch per direct instruction (the same
## ratio the Hub's own touchscreen dialog text landed on -- see ui_kit.gd's
## MOBILE_BODY_FONT_SIZE) -- text, swatches, buttons, and spacing all read
## as "puny" at their plain desktop sizes once actually tested on a phone.
## Applied via _s()/_si() at construction time in _build_ui() and friends,
## not live on resize -- matches how _apply_responsive_layout() already
## only re-flows the OUTER container shape on a live mobile<->desktop
## transition, never rebuilding the finer buttons/swatches inside.
const MOBILE_SCALE := 4.0 / 3.0

var appearance: Dictionary
var _preview_root: Node3D
var _preview_container: SubViewportContainer
var _controls: Control
var _panel_shell: MarginContainer
var _layout: Container
var _status: Label
var _save_button: Button
var _mobile := false
var _saving := false
var _color_map_icon: ImageTexture
var _kaixin_pattern_unlocked := false
var _kaixin_pattern_texture: Texture2D
var _choice_buttons: Array[Dictionary] = []
var _color_buttons: Array[Dictionary] = []

func setup(initial: Dictionary, owned_contributor_key := "") -> void:
	_kaixin_pattern_unlocked = owned_contributor_key in ["kaixin", "leonard"]
	appearance = _defaults()
	appearance.merge(initial, true)
	if _kaixin_pattern_unlocked and appearance.get("shirt_texture") != null:
		appearance["shirt_pattern"] = "kaixin_polka"
	# Textures are runtime resources and cannot be stored in the account JSON.
	appearance.erase("shirt_texture")
	# Kaixin's Kuehoke dots are her contributor easter egg, not a public preset.
	# Drop a stale or injected selection when another account opens the editor.
	if not _kaixin_pattern_unlocked:
		appearance.erase("shirt_pattern")
	if not appearance.has("body_preset"):
		appearance["body_preset"] = "soft" if appearance.get("is_female", false) else "slim"

func _ready() -> void:
	layer = 80
	# Determined up front now (was previously only ever set inside
	# _apply_responsive_layout(), after _build_ui() had already run) so
	# _build_ui() itself can bake in the correct mobile-scaled sizes from
	# the start, instead of building desktop-sized content this same frame
	# only leaves in place until the first resize event happens to fire.
	_mobile = _is_mobile_layout()
	_build_ui()
	_build_preview_world()
	_rebuild_preview()
	get_viewport().size_changed.connect(_apply_responsive_layout)
	_apply_responsive_layout()

func _process(_delta: float) -> void:
	if not _saving or not OS.has_feature("web"):
		return
	var window := JavaScriptBridge.get_interface("window")
	var state := str(window.kuehCharacterSaveState)
	if state == "saved":
		_saving = false
		appearance_saved.emit(appearance.duplicate(true))
		_close()
	elif state == "error":
		_saving = false
		_status.text = "Could not save: " + str(window.kuehCharacterSaveError)
		_save_button.disabled = false

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_close()
		get_viewport().set_input_as_handled()

func _build_ui() -> void:
	var backdrop := ColorRect.new()
	backdrop.color = Color("f2f1ed")
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(backdrop)

	var margin := MarginContainer.new()
	# CanvasLayer is not a Control, so it cannot propagate the shared theme.
	# Put the canonical Eleblorb theme on the editor's Control root; without
	# this, labels with explicit sizes looked correct while every Button fell
	# back to Godot's tiny default type and ordinary rounded rectangles.
	margin.theme = _editor_theme()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", UITheme.SPACE_LG)
	margin.add_theme_constant_override("margin_right", UITheme.SPACE_LG)
	# Top margin shrinks (not scales up like everything else) on mobile per
	# direct instruction -- one of the two places pixels are reclaimed for
	# the larger content below to fit in, the other being the preview's own
	# reduced height (see _preview_container below).
	margin.add_theme_constant_override("margin_top", UITheme.SPACE_XS if _mobile else UITheme.SPACE_LG)
	margin.add_theme_constant_override("margin_bottom", UITheme.SPACE_LG)
	add_child(margin)

	# Mobile/desktop shape decided here now (matches _apply_responsive_
	# layout()'s own formula for a live transition) instead of always
	# building the desktop HBoxContainer shape and relying on that function
	# to fix it up after the fact on the very first frame.
	_layout = VBoxContainer.new() if _mobile else HBoxContainer.new()
	_layout.add_theme_constant_override("separation", _si(UITheme.SPACE_MD) if _mobile else UITheme.SPACE_LG)
	margin.add_child(_layout)

	_preview_container = SubViewportContainer.new()
	_preview_container.stretch = true
	# Mobile height reduced from 255 -> 210 per direct instruction, the
	# other half of reclaiming pixels for the larger content below (see the
	# outer margin_top above). The camera in _build_preview_world() stays
	# shared with desktop rather than a mobile-specific tighter crop --
	# verified via a headless render first (SubViewportContainer.stretch
	# scales the doll uniformly into the shorter box with no distortion or
	# cropping, just a slightly smaller figure), and a camera re-tuned
	# against one hand-picked body preset risked framing oddly for others
	# (Hunky/More-tall, etc) with no way to check every combination.
	_preview_container.custom_minimum_size = Vector2(0, 210) if _mobile else Vector2(430, 420)
	_preview_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_preview_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_layout.add_child(_preview_container)

	_panel_shell = MarginContainer.new()
	_controls = _panel_shell
	_controls.custom_minimum_size.x = 0 if _mobile else 510
	_controls.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_controls.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_layout.add_child(_controls)
	_panel_shell.add_theme_constant_override("margin_top", 0 if _mobile else 56)
	var panel := UIKit.panel()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_panel_shell.add_child(panel)
	panel.add_theme_stylebox_override("panel", _editor_panel_style())
	var panel_content := VBoxContainer.new()
	panel_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel_content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel_content.add_theme_constant_override("separation", 0)
	panel.add_child(panel_content)

	# Only the editor body is inset. Keeping the footer outside this padding
	# lets its top rule meet the panel edges and the scroll viewport precisely.
	var body_padding := MarginContainer.new()
	body_padding.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body_padding.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body_padding.add_theme_constant_override("margin_left", _si(UITheme.SPACE_XL))
	body_padding.add_theme_constant_override("margin_right", _si(UITheme.SPACE_XL))
	body_padding.add_theme_constant_override("margin_top", _si(UITheme.SPACE_XL))
	# The scroll viewport ends directly at the footer rule. Bottom breathing
	# room belongs inside the scrolling content, not between viewport and rule.
	body_padding.add_theme_constant_override("margin_bottom", 0)
	panel_content.add_child(body_padding)
	var body := VBoxContainer.new()
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", _si(UITheme.SPACE_MD))
	body_padding.add_child(body)
	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", _si(UITheme.SPACE_MD))
	body.add_child(header)
	var heading := UIKit.heading("Edit character")
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if _mobile:
		heading.add_theme_font_size_override("font_size", _si(UITheme.FONT_HEADING))
	header.add_child(heading)
	var inner_scroll := ScrollContainer.new()
	inner_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	inner_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	inner_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(inner_scroll)
	var sections := VBoxContainer.new()
	sections.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sections.add_theme_constant_override("separation", _si(UITheme.SPACE_LG))
	inner_scroll.add_child(sections)
	_add_choice_section(sections, "Build", [
		{"label": "Soft", "value": "soft"}, {"label": "Skinny", "value": "slim"}, {"label": "Hunky", "value": "broad"}
	], "body_preset")
	_add_choice_section(sections, "Height", [
		{"label": "Less tall", "value": 0.94}, {"label": "Tall", "value": 1.0}, {"label": "More tall", "value": 1.06}
	], "height_scale")
	_add_color_section(sections, "Skin tone", SKIN_SWATCHES, "skin")
	_add_choice_section(sections, "Hair style", HAIR_STYLES, "hair_style")
	_add_color_section(sections, "Hair color", HAIR_SWATCHES, "hair")
	_add_choice_section(sections, "Glasses", [
		{"label": "None", "value": "none"}, {"label": "Rectangular", "value": "rect"}, {"label": "Round", "value": "round"}, {"label": "On head", "value": "head"}
	], "glasses_choice")
	_add_clothing_section(sections, "Top", [
		{"label": "Sleeveless", "value": "none"}, {"label": "Short sleeve", "value": "short"}, {"label": "Half sleeve", "value": "colored_upper_arm"}, {"label": "Long sleeve", "value": "long"}
	], "sleeve_style", "top")
	_add_clothing_section(sections, "Bottom", [
		{"label": "Pants", "value": false}, {"label": "Skirt", "value": true}
	], "dress", "bottom")
	_add_color_section(sections, "Shoes", CLOTH_SWATCHES, "shoes")
	# Without this the last row (Shoes) sits flush against the scroll
	# viewport's own bottom edge, crowding the footer divider directly above
	# it. Belongs inside the scrolling content itself -- see body_padding's
	# own zero bottom margin above for why.
	var bottom_spacer := Control.new()
	bottom_spacer.custom_minimum_size.y = _si(UITheme.SPACE_LG)
	sections.add_child(bottom_spacer)

	# The explicit discard/save choices stay fixed below the scrolling options.
	# This avoids an ambiguous top-right dismissal and keeps the main action in
	# reach even when the editor content is long.
	# Treat the rule and action bar as one bottom-anchored region. The rule is
	# its first child, so it always moves with the footer's top edge when the
	# footer padding changes instead of appearing detached from the bar.
	var footer_region := VBoxContainer.new()
	footer_region.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	footer_region.size_flags_vertical = Control.SIZE_SHRINK_END
	footer_region.add_theme_constant_override("separation", 0)
	panel_content.add_child(footer_region)
	var footer_divider := UIKit.divider(UITheme.BUTTON_BORDER, 3.0)
	footer_divider.size_flags_vertical = Control.SIZE_FILL
	footer_region.add_child(footer_divider)
	var footer_padding := MarginContainer.new()
	# A 126px action region gives the 78px controls 24px of breathing room
	# above and below (scaled together on mobile, so that relationship
	# still holds at the larger size). The divider remains outside that
	# inset as the region's exact top edge.
	footer_padding.custom_minimum_size.y = _si(126)
	footer_padding.add_theme_constant_override("margin_left", _si(UITheme.SPACE_XL))
	footer_padding.add_theme_constant_override("margin_right", _si(UITheme.SPACE_XL))
	footer_padding.add_theme_constant_override("margin_top", _si(UITheme.SPACE_MD))
	footer_padding.add_theme_constant_override("margin_bottom", _si(UITheme.SPACE_MD))
	footer_region.add_child(footer_padding)
	var footer := HBoxContainer.new()
	footer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	footer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	footer.add_theme_constant_override("separation", _si(UITheme.SPACE_SM))
	footer_padding.add_child(footer)
	_status = UIKit.caption_label("")
	_status.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_status.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_status.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	if _mobile:
		_status.add_theme_font_size_override("font_size", _si(UITheme.FONT_CAPTION))
	footer.add_child(_status)
	var actions := HBoxContainer.new()
	actions.alignment = BoxContainer.ALIGNMENT_END
	actions.size_flags_horizontal = Control.SIZE_SHRINK_END
	actions.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	actions.add_theme_constant_override("separation", _si(UITheme.SPACE_SM))
	footer.add_child(actions)
	actions.add_child(_editor_button("Cancel", _close, false))
	_save_button = _editor_button("Save character", _save, false)
	actions.add_child(_save_button)

## Shared by every section's own title label -- font size scaled to match
## the rest of the mobile content instead of staying at UIKit.body_label()'s
## plain UITheme.FONT_BODY regardless of viewport.
func _section_title(title: String) -> Label:
	var label := UIKit.body_label(title)
	if _mobile:
		label.add_theme_font_size_override("font_size", _si(UITheme.FONT_BODY))
	return label

func _add_choice_section(parent: VBoxContainer, title: String, options: Array, key: String) -> void:
	var group := VBoxContainer.new()
	group.add_theme_constant_override("separation", _si(UITheme.SPACE_XS))
	parent.add_child(group)
	group.add_child(_section_title(title))
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", _si(UITheme.SPACE_SM))
	row.add_theme_constant_override("v_separation", _si(UITheme.SPACE_SM))
	group.add_child(row)
	var selection_group := ButtonGroup.new()
	selection_group.allow_unpress = false
	for option in options:
		var option_value: Variant = option["value"]
		var option_key := key
		var button := _editor_button(str(option["label"]), func() -> void: _set_option(option_key, option_value))
		button.button_group = selection_group
		_choice_buttons.append({"button": button, "key": option_key, "value": option_value})
		row.add_child(button)
	_refresh_selection_states()

func _add_clothing_section(parent: VBoxContainer, title: String, options: Array, style_key: String, color_key: String) -> void:
	var group := VBoxContainer.new()
	group.add_theme_constant_override("separation", _si(UITheme.SPACE_SM))
	parent.add_child(group)
	group.add_child(_section_title(title))
	var choices := HFlowContainer.new()
	choices.add_theme_constant_override("h_separation", _si(UITheme.SPACE_SM))
	choices.add_theme_constant_override("v_separation", _si(UITheme.SPACE_SM))
	group.add_child(choices)
	var selection_group := ButtonGroup.new()
	selection_group.allow_unpress = false
	for option in options:
		var option_value: Variant = option["value"]
		var option_key := style_key
		var button := _editor_button(str(option["label"]), func() -> void: _set_option(option_key, option_value))
		button.button_group = selection_group
		_choice_buttons.append({"button": button, "key": option_key, "value": option_value})
		choices.add_child(button)
	group.add_child(_color_row(CLOTH_SWATCHES, color_key, title + " color"))

func _add_color_section(parent: VBoxContainer, title: String, colors: Array, key: String) -> void:
	var group := VBoxContainer.new()
	group.add_theme_constant_override("separation", _si(UITheme.SPACE_XS))
	parent.add_child(group)
	group.add_child(_section_title(title))
	group.add_child(_color_row(colors, key, title))

func _color_row(colors: Array, key: String, accessible_name: String) -> HFlowContainer:
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", _si(UITheme.SPACE_SM))
	row.add_theme_constant_override("v_separation", _si(UITheme.SPACE_SM))
	for html in colors:
		var color := Color(str(html))
		var swatch := Button.new()
		swatch.custom_minimum_size = Vector2(_s(72), _s(72))
		swatch.tooltip_text = "Choose " + accessible_name.to_lower()
		swatch.accessibility_name = swatch.tooltip_text
		var normal := SuperellipseStyleBox.new()
		normal.bg_color = color
		normal.corner_radius = UITheme.BUTTON_CORNER_RADIUS
		normal.corner_ratio = UITheme.SUPERELLIPSE_RATIO
		normal.exponent = UITheme.SUPERELLIPSE_EXPONENT
		normal.border_width = 3
		normal.border_color = UITheme.BUTTON_BORDER
		swatch.add_theme_stylebox_override("normal", normal)
		swatch.add_theme_stylebox_override("hover", normal)
		swatch.add_theme_stylebox_override("pressed", normal)
		swatch.add_theme_stylebox_override("focus", UITheme.focus_ring_stylebox())
		swatch.pressed.connect(func() -> void: _set_option(key, color))
		_color_buttons.append({"button": swatch, "key": key, "color": color, "custom": false})
		row.add_child(swatch)
	if key == "top" and _kaixin_pattern_unlocked:
		var pattern_swatch := _kaixin_pattern_swatch()
		_color_buttons.append({"button": pattern_swatch, "key": key, "pattern": "kaixin_polka", "custom": false})
		row.add_child(pattern_swatch)
	var custom := _custom_color_swatch(key, accessible_name)
	_color_buttons.append({"button": custom, "key": key, "custom": true})
	row.add_child(custom)
	_refresh_selection_states()
	return row

func _kaixin_pattern_swatch() -> Button:
	if _kaixin_pattern_texture == null:
		_kaixin_pattern_texture = _kaixin_swatch_texture()
	var button := Button.new()
	button.custom_minimum_size = Vector2(_s(72), _s(72))
	button.tooltip_text = "Kara-o-kueh polka dots"
	button.accessibility_name = button.tooltip_text
	button.icon = _kaixin_pattern_texture
	button.expand_icon = true
	button.icon_max_width = _si(66)
	for state in [&"normal", &"hover", &"pressed", &"disabled"]:
		button.add_theme_stylebox_override(state, _swatch_style(Color("150f1e"), 3))
	button.add_theme_stylebox_override("focus", UITheme.focus_ring_stylebox())
	button.pressed.connect(_select_kaixin_pattern)
	return button

func _kaixin_swatch_texture() -> ImageTexture:
	# The earlier pattern was a square icon floating inside the swatch. Mask
	# the artwork to the same rounded-superellipse geometry as the color fill,
	# sized to the 3px inner edge of a 72px swatch.
	const SIZE := 66
	var image := Image.create(SIZE, SIZE, false, Image.FORMAT_RGBA8)
	var background := Color("150f1e")
	var dot := Color("ff2e93")
	var half := SIZE * 0.5
	var radius := minf(UITheme.BUTTON_CORNER_RADIUS - 3.0, SIZE * UITheme.SUPERELLIPSE_RATIO)
	var straight_half := half - radius
	var dot_step := float(SIZE) / 6.0
	for y in SIZE:
		for x in SIZE:
			var px := absf((x + 0.5) - half)
			var py := absf((y + 0.5) - half)
			var corner_x := maxf(px - straight_half, 0.0) / radius
			var corner_y := maxf(py - straight_half, 0.0) / radius
			if pow(corner_x, UITheme.SUPERELLIPSE_EXPONENT) + pow(corner_y, UITheme.SUPERELLIPSE_EXPONENT) > 1.0:
				image.set_pixel(x, y, Color.TRANSPARENT)
				continue
			var col := floori(float(x) / dot_step)
			var row := floori(float(y) / dot_step)
			var center := Vector2((col + 0.5) * dot_step, (row + 0.5) * dot_step)
			image.set_pixel(x, y, dot if Vector2(x + 0.5, y + 0.5).distance_to(center) <= 2.8 else background)
	return ImageTexture.create_from_image(image)

func _select_kaixin_pattern() -> void:
	appearance["top"] = Color("150f1e")
	appearance["shirt_pattern"] = "kaixin_polka"
	_status.text = "Unsaved changes"
	_refresh_selection_states()
	_rebuild_preview()

func _custom_color_swatch(key: String, accessible_name: String) -> Button:
	var button := Button.new()
	button.custom_minimum_size = Vector2(_s(72), _s(72))
	button.tooltip_text = "Choose a custom " + accessible_name.to_lower()
	button.accessibility_name = button.tooltip_text
	button.icon = _color_map_texture()
	button.expand_icon = true
	button.icon_max_width = _si(72)
	for state in [&"normal", &"hover", &"pressed", &"disabled"]:
		button.add_theme_stylebox_override(state, _swatch_style(Color.TRANSPARENT, 3))
	button.add_theme_stylebox_override("focus", UITheme.focus_ring_stylebox())
	var popup := PopupPanel.new()
	popup.theme = UITheme.get_theme()
	popup.add_theme_stylebox_override("panel", _editor_panel_style())
	var picker_center := CenterContainer.new()
	picker_center.custom_minimum_size = Vector2(430, 340)
	var picker := ColorPicker.new()
	picker.custom_minimum_size = Vector2(360, 270)
	picker.color = appearance.get(key, Color.WHITE)
	_configure_simple_picker(picker)
	picker.color_changed.connect(func(color: Color) -> void: _set_option(key, color))
	picker_center.add_child(picker)
	popup.add_child(picker_center)
	add_child(popup)
	button.pressed.connect(func() -> void:
		picker.color = appearance.get(key, Color.WHITE)
		popup.popup_centered(Vector2i(430, 340))
	)
	return button

func _color_map_texture() -> ImageTexture:
	if _color_map_icon != null:
		return _color_map_icon
	var map_size := 64
	var image := Image.create(map_size, map_size, false, Image.FORMAT_RGBA8)
	for y in range(map_size):
		for x in range(map_size):
			var nx := absf((float(x) / float(map_size - 1)) * 2.0 - 1.0)
			var ny := absf((float(y) / float(map_size - 1)) * 2.0 - 1.0)
			var curve := pow(nx, UITheme.SUPERELLIPSE_EXPONENT) + pow(ny, UITheme.SUPERELLIPSE_EXPONENT)
			# Leave only the same narrow white stroke around the map that every
			# solid swatch receives; the spectrum otherwise fills the control.
			if curve > 0.82:
				image.set_pixel(x, y, Color.TRANSPARENT)
				continue
			var hue := float(x) / float(map_size - 1)
			var saturation := 0.18 + 0.82 * float(y) / float(map_size - 1)
			var value := 1.0 - 0.18 * float(y) / float(map_size - 1)
			image.set_pixel(x, y, Color.from_hsv(hue, saturation, value))
	_color_map_icon = ImageTexture.create_from_image(image)
	return _color_map_icon

func _configure_simple_picker(picker: ColorPicker) -> void:
	picker.picker_shape = ColorPicker.SHAPE_HSV_RECTANGLE
	picker.color_modes_visible = false
	picker.sliders_visible = false
	picker.hex_visible = false
	picker.presets_visible = false
	picker.sampler_visible = false

func _editor_button(text: String, callback: Callable, selectable := true) -> Button:
	var button := UIKit.button(text, callback)
	button.custom_minimum_size = Vector2(_s(164), _s(78))
	button.add_theme_font_size_override("font_size", _si(UITheme.FONT_BUTTON))
	button.toggle_mode = selectable
	return button

func _set_option(key: String, value: Variant) -> void:
	if key == "glasses_choice":
		appearance["glasses"] = value != "none"
		appearance["round_glasses"] = value == "round"
		appearance["glasses_on_hair"] = value == "head"
	elif key == "body_preset":
		appearance["body_preset"] = value
		_apply_body_preset(str(value))
	else:
		appearance[key] = value
		if key == "top":
			appearance.erase("shirt_pattern")
		if key == "sleeve_style":
			# The editor's Short sleeve is real sleeve geometry (Kevin's shirt).
			# Half sleeve is the separate colored-upper-arm construction.
			appearance["allow_female_short_sleeves"] = value == "short"
	_status.text = "Unsaved changes"
	_refresh_selection_states()
	_rebuild_preview()

func _refresh_selection_states() -> void:
	for entry in _choice_buttons:
		var selected: bool = _current_choice_value(str(entry["key"])) == entry["value"]
		var button := entry["button"] as Button
		button.set_pressed_no_signal(selected)
		_apply_choice_style(button, selected)
	for entry in _color_buttons:
		var button := entry["button"] as Button
		var selected := false
		var pattern_active: bool = entry["key"] == "top" and not str(appearance.get("shirt_pattern", "")).is_empty()
		if entry.has("pattern"):
			selected = appearance.get("shirt_pattern", "") == entry["pattern"]
		elif entry.get("custom", false):
			selected = not pattern_active and not _matches_any_preset(appearance.get(entry["key"], Color.WHITE), entry["key"])
		else:
			selected = not pattern_active and _colors_match(appearance.get(entry["key"], Color.WHITE), entry["color"])
		button.set_pressed_no_signal(selected)
		var fill: Color = Color.TRANSPARENT if entry.get("custom", false) or entry.has("pattern") else entry.get("color", Color.WHITE) as Color
		var style := _swatch_style(fill, 6 if selected else 3)
		for state in [&"normal", &"hover", &"pressed", &"disabled"]:
			button.add_theme_stylebox_override(state, style)

func _current_choice_value(key: String) -> Variant:
	if key == "glasses_choice":
		if not appearance.get("glasses", false):
			return "none"
		if appearance.get("glasses_on_hair", false):
			return "head"
		return "round" if appearance.get("round_glasses", false) else "rect"
	return appearance.get(key)

func _apply_choice_style(button: Button, selected: bool) -> void:
	var normal := _neutral_button_style(Color("686868") if selected else Color("343434"), 5 if selected else 3)
	button.add_theme_stylebox_override("normal", normal)
	button.add_theme_stylebox_override("pressed", normal)
	button.add_theme_stylebox_override("hover", _neutral_button_style(Color("505050"), 4 if selected else 3))

func _matches_any_preset(value: Variant, key: String) -> bool:
	var palette: Array = SKIN_SWATCHES if key == "skin" else HAIR_SWATCHES if key == "hair" else CLOTH_SWATCHES
	for html in palette:
		if _colors_match(value, Color(str(html))):
			return true
	return false

func _colors_match(a: Variant, b: Color) -> bool:
	return a is Color and (a as Color).is_equal_approx(b)

func _swatch_style(fill: Color, border_width: int) -> SuperellipseStyleBox:
	var style := SuperellipseStyleBox.new()
	style.bg_color = fill
	style.border_color = UITheme.BUTTON_BORDER
	style.border_width = border_width
	style.corner_radius = UITheme.BUTTON_CORNER_RADIUS
	style.corner_ratio = UITheme.SUPERELLIPSE_RATIO
	style.exponent = UITheme.SUPERELLIPSE_EXPONENT
	style.set_content_margin_all(0)
	return style

func _neutral_button_style(fill: Color, border_width: int) -> SuperellipseStyleBox:
	var style := _swatch_style(fill, border_width)
	style.content_margin_left = _s(UITheme.SPACE_MD)
	style.content_margin_right = _s(UITheme.SPACE_MD)
	style.content_margin_top = _s(UITheme.SPACE_SM)
	style.content_margin_bottom = _s(UITheme.SPACE_SM)
	return style

func _editor_panel_style() -> SuperellipseStyleBox:
	var style := SuperellipseStyleBox.new()
	style.bg_color = Color("2d2d2de8")
	style.corner_radius = UITheme.PANEL_CORNER_RADIUS
	style.corner_ratio = UITheme.SUPERELLIPSE_RATIO
	style.exponent = UITheme.SUPERELLIPSE_EXPONENT
	style.shadow_size = 9
	style.shadow_color = Color(0, 0, 0, 0.24)
	# Child regions own their padding so the sticky-footer divider can run
	# continuously to the panel boundary.
	style.set_content_margin_all(0)
	return style

func _editor_theme() -> Theme:
	var theme := UITheme.get_theme().duplicate(true) as Theme
	theme.set_stylebox("normal", "Button", _neutral_button_style(Color("343434"), 3))
	theme.set_stylebox("hover", "Button", _neutral_button_style(Color("505050"), 3))
	theme.set_stylebox("pressed", "Button", _neutral_button_style(Color("686868"), 5))
	theme.set_stylebox("disabled", "Button", _neutral_button_style(Color("454545"), 2))
	return theme

func _apply_body_preset(preset: String) -> void:
	appearance.merge(BODY_PRESETS.get(preset, BODY_PRESETS["slim"]), true)

func _build_preview_world() -> void:
	var viewport := SubViewport.new()
	viewport.size = Vector2i(640, 720)
	viewport.transparent_bg = false
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.world_3d = World3D.new()
	_preview_container.add_child(viewport)

	var environment_node := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("f2f1ed")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color.WHITE
	environment.ambient_light_energy = 0.62
	environment_node.environment = environment
	viewport.add_child(environment_node)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-42, -35, 0)
	light.light_energy = 0.72
	viewport.add_child(light)
	var camera := Camera3D.new()
	camera.position = Vector3(0, 1.55, 4.7)
	# Narrowing the camera from its 75° default makes the doll read at roughly
	# 2.2× its former on-screen size without scaling or moving the figure rig.
	camera.fov = 38.5
	camera.look_at_from_position(camera.position, Vector3(0, 1.3, 0))
	camera.current = true
	viewport.add_child(camera)
	_preview_root = Node3D.new()
	viewport.add_child(_preview_root)

func _rebuild_preview() -> void:
	if _preview_root == null:
		return
	for child in _preview_root.get_children():
		child.queue_free()
	FigureBuilder.build(_preview_root, appearance, true)

func _apply_responsive_layout() -> void:
	var wants_mobile := _is_mobile_layout()
	if wants_mobile == _mobile:
		return
	_mobile = wants_mobile
	var parent := _layout.get_parent()
	var preview_index := _preview_container.get_index()
	var controls_index := _controls.get_index()
	_layout.remove_child(_preview_container)
	_layout.remove_child(_controls)
	parent.remove_child(_layout)
	_layout.queue_free()
	_layout = VBoxContainer.new() if _mobile else HBoxContainer.new()
	_layout.add_theme_constant_override("separation", _si(UITheme.SPACE_MD) if _mobile else UITheme.SPACE_LG)
	parent.add_child(_layout)
	_layout.add_child(_preview_container)
	_layout.add_child(_controls)
	# Matches _build_ui()'s own initial values (see that function's own
	# comments for why 210/XS instead of the desktop 255/LG) -- note this
	# only re-flows the outer preview/controls shape, not the finer
	# buttons/swatches/spacing _build_ui() bakes in at construction time,
	# same pre-existing limitation as before this file's own mobile-scale
	# work (a live resize crossing the breakpoint mid-edit is a rare enough
	# case that a full content rebuild here wasn't already worth it).
	_preview_container.custom_minimum_size = Vector2(0, 210) if _mobile else Vector2(430, 420)
	_controls.custom_minimum_size.x = 0 if _mobile else 510
	_panel_shell.add_theme_constant_override("margin_top", 0 if _mobile else 56)
	if preview_index < 0 or controls_index < 0:
		return

func _is_mobile_layout() -> bool:
	# The exported game uses a fixed logical render size, so Godot's visible
	# rect remains desktop-width even when CSS has made the canvas phone-sized.
	# On web, the browser's CSS viewport is the actual responsive breakpoint.
	if OS.has_feature("web"):
		var window := JavaScriptBridge.get_interface("window")
		if window != null:
			return float(window.innerWidth) < UIKit.MOBILE_BREAKPOINT_WIDTH
	return UIKit.is_mobile_viewport(self)

## Scales a float size by MOBILE_SCALE when _mobile, otherwise a no-op --
## the one place that ratio is actually applied, so every call site below
## (spacing, swatch/button sizes, font sizes via _si()) reads as "this
## value, mobile-scaled" rather than repeating the ternary everywhere.
func _s(value: float) -> float:
	return value * MOBILE_SCALE if _mobile else value

## _s(), rounded to an int -- for theme constants (margins/separations) and
## font sizes, which Godot's theme overrides require as whole numbers.
func _si(value: float) -> int:
	return int(round(_s(value)))

func _save() -> void:
	if _saving:
		return
	if not OS.has_feature("web"):
		_status.text = "Saving is available in the web version."
		return
	var payload := appearance.duplicate(true)
	for key in ["skin", "hair", "top", "bottom", "shoes"]:
		if payload.get(key) is Color:
			payload[key] = (payload[key] as Color).to_html(false)
	_saving = true
	_save_button.disabled = true
	_status.text = "Saving…"
	var window := JavaScriptBridge.get_interface("window")
	window.saveKuehCharacterJson(JSON.stringify(payload))

func _close() -> void:
	closed.emit()
	queue_free()

func _defaults() -> Dictionary:
	return {
		"height_scale": 1.0, "build_scale": 1.0,
		"body_preset": "slim",
		"chest_build_scale": 1.0, "hip_build_scale": 1.0,
		"abdomen_width_scale": 1.0, "abdomen_matches_hips": true,
		"skin": Color("f3cfb8"), "hair": Color("6a4632"),
		"hair_style": "hero", "top": Color("f7f5ef"),
		"bottom": Color("777a7c"), "shoes": Color("a87342"),
		"glasses": false, "round_glasses": false,
		"glasses_on_hair": false, "dress": false,
		"is_female": false, "sleeve_style": "long"
	}
