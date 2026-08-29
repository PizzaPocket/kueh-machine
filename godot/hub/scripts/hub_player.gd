class_name HubPlayer
extends CharacterBody3D

signal interact_requested

const WALK_SPEED := 4.2
const RUN_SPEED := 7.2
const JUMP_VELOCITY := 6.4
const TURN_SPEED := 10.0
const MOUSE_SENSITIVITY := 0.0024
const GAMEPAD_LOOK_SPEED := 2.2
const WALK_SWING_SPEED := 1.7
const WALK_SWING_AMOUNT := 0.5
## How much extra front-to-back depth (as a fraction of the skirt's own
## resting depth) is added at the stride's extremes, so the legs don't clip
## through it -- see _animate()'s skirt_flare. Sized to roughly the thigh's
## own forward reach at WALK_SWING_AMOUNT (thigh length * sin(swing) against
## the now-flatter resting depth), not an arbitrary margin -- the smallest
## expansion that should still clear a normal walking stride.
const DRESS_HIP_STRIDE_GIVE := 0.06
## A jump's hip bend is far more extreme than a walking stride (see
## JUMP_HIP_BEND), so it gets its own larger flare, plus the skirt's hem
## itself lifting toward the rising knees (SKIRT_JUMP_HEM_LIFT) so the two
## effects share the job of clearing the tucked pose instead of the flare
## alone doing something implausibly large.
const SKIRT_JUMP_FLARE := 0.30
const SKIRT_JUMP_HEM_LIFT := 0.15
const SPRINT_SWING_SPEED_SCALE := 0.72
const SPRINT_SWING_AMOUNT := 0.8
const SPRINT_BEND_SCALE := 1.45
const SPRINT_STRIDE_EASE := 0.35
const SPRINT_ELBOW_MIN_FRACTION := 0.35
const SPRINT_ELBOW_EXTRA_BEND := 1.3
const KNEE_STANCE_BEND_AMOUNT := deg_to_rad(38.0)
const ANKLE_DORSIFLEX_AMOUNT := deg_to_rad(18.0)
const ANKLE_PLANTARFLEX_AMOUNT := deg_to_rad(20.0)
const SPINE_LEAN_MAX_WALK := deg_to_rad(3.0)
const SPINE_LEAN_MAX_RUN := deg_to_rad(6.0)
const RUN_BODY_BOB_AMOUNT := 0.025
const POSE_SETTLE_SPEED := 8.0
# Eleblorb's idle contrapposto -- same constants and rig logic as HubNPC's
# own _roll_idle_pose()/_settle_pose(), rerolled at each walk-to-idle
# transition (see hub_roaming_npc.gd's _enter_rest()) rather than held fixed.
const IDLE_ELBOW_MIN := deg_to_rad(3.0)
const IDLE_ELBOW_MAX := deg_to_rad(9.0)
const CONTRAPPOSTO_CHANCE := 0.64
const IDLE_KNEE_MIN := deg_to_rad(4.0)
const IDLE_KNEE_MAX := deg_to_rad(11.0)
const IDLE_HIP_OUTWARD_ANGLE := deg_to_rad(3.5)
const IDLE_HIP_EXTERNAL_ROTATION := deg_to_rad(8.0)
const IDLE_HIP_DROP_ANGLE := deg_to_rad(3.8)
const IDLE_SPINE_COUNTER_ANGLE := deg_to_rad(2.8)
const IDLE_BODY_TWIST_MAX := deg_to_rad(2.0)
const IDLE_ARM_SWAY_MAX := deg_to_rad(3.0)
const JUMP_ARM_SWING := deg_to_rad(35.0)
const JUMP_ARM_ASYMMETRY := deg_to_rad(5.0)
const JUMP_ELBOW_BEND := deg_to_rad(55.0)
const JUMP_ELBOW_ASYMMETRY := deg_to_rad(12.0)
const JUMP_HIP_BEND := deg_to_rad(82.0)
const JUMP_HIP_ASYMMETRY := deg_to_rad(10.0)
const JUMP_KNEE_BEND := deg_to_rad(130.0)
const JUMP_KNEE_ASYMMETRY := deg_to_rad(7.0)
const JUMP_ANKLE_EXTEND := deg_to_rad(22.0)
const JUMP_ANKLE_ASYMMETRY := deg_to_rad(6.0)
const JUMP_POSE_SETTLE_SPEED := 9.0
const LANDING_DURATION := 0.18
# Match Eleblorb's anatomical camera-follow constraints: the head tracks the
# view while it remains within a plausible neck range, then eases back to the
# body's forward direction rather than holding at an extreme twist.
const HEAD_YAW_LIMIT := deg_to_rad(75.0)
const HEAD_PITCH_UP_LIMIT := deg_to_rad(50.0)
const HEAD_PITCH_DOWN_LIMIT := deg_to_rad(60.0)
const HEAD_TURN_SPEED := 10.0
const STEP_LOOKAHEAD := 0.42
const PROP_STEP_MAX_HEIGHT := 0.38
const PROP_STEP_PROBE_CLEARANCE := 0.18

var input_locked := true
var _yaw := 0.0
var _pitch := -0.18
var _walk_phase := 0.0
var _figure: Dictionary
var _camera_pivot: Node3D
var _camera: Camera3D
var _camera_rig: Node3D
var _collision: CollisionShape3D
var _spine_rest_y := 0.0
var _hips_rest_y := 0.0
var _skirt_rest_y := 0.0
var _was_on_floor := true
var _landing_timer := 0.0
var appearance_override: Dictionary = {}
var _rng := RandomNumberGenerator.new()
var _was_moving := false
var _idle_elbow_left := 0.0
var _idle_elbow_right := 0.0
var _idle_leg_variant_active := false
var _idle_bent_leg_side := 1.0
var _idle_knee_bend := 0.0
var _idle_spine_counter := 0.0
var _idle_body_twist := 0.0
var _idle_arm_left := 0.0
var _idle_arm_right := 0.0

func _ready() -> void:
	name = "Player"
	add_to_group("player")
	floor_snap_length = 0.32
	_collision = CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.38
	capsule.height = 2.1
	_collision.shape = capsule
	_collision.position.y = 1.05
	add_child(_collision)
	_figure = FigureBuilder.build(self, _resolved_appearance(appearance_override), true)
	_sync_figure_dimensions()
	_build_camera(float(_figure.get("total_height", 1.8)))
	_rng.randomize()
	_roll_idle_pose()
	# Not captured here -- browsers require an actual user gesture (click,
	# keypress) before granting pointer lock, so requesting it immediately
	# on load always failed. _unhandled_input handles the first real click.

## The rig's own local convention is "+Z is forward" (see procedural_figure.gd),
## and only the visual root -- not the physics CharacterBody3D itself --
## rotates to face movement direction, so the body's facing lives on its yaw.
func body_forward() -> Vector3:
	var yaw := (_figure["root"] as Node3D).rotation.y
	return Vector3(sin(yaw), 0.0, cos(yaw))

func _resolved_appearance(override: Dictionary) -> Dictionary:
	var appearance := {
		"height_scale": 1.0,
		"build_scale": 1.0,
		"skin": HubPalette.FAIR_SKIN,
		"hair": HubPalette.PLAYER_HAIR,
		"hair_style": FigureHair.STYLE_HERO,
		"is_female": false,
		"top": HubPalette.WHITE,
		"bottom": Color("777b80"),
		"shoes": HubPalette.BROWN_LEATHER,
	}
	appearance.merge(override, true)
	return appearance

func _sync_figure_dimensions() -> void:
	var capsule := _collision.shape as CapsuleShape3D
	capsule.height = maxf(capsule.radius * 2.0, float(_figure.get("total_height", 2.1)))
	_collision.position.y = capsule.height * 0.5
	_spine_rest_y = (_figure["spine"] as Node3D).position.y
	_hips_rest_y = (_figure["hips"] as Node3D).position.y
	var skirt: Node3D = _figure.get("skirt")
	if skirt != null:
		_skirt_rest_y = skirt.position.y
	if _camera_rig != null:
		_camera_rig.position.y = float(_figure.get("total_height", 1.8)) * 0.87

func apply_appearance(new_appearance: Dictionary) -> void:
	appearance_override = new_appearance.duplicate(true)
	if not _figure.is_empty():
		var old_root := _figure.get("root") as Node3D
		if old_root != null:
			remove_child(old_root)
			old_root.queue_free()
	_figure = FigureBuilder.build(self, _resolved_appearance(appearance_override), true)
	(_figure["root"] as Node3D).rotation.y = _yaw
	_sync_figure_dimensions()
	# Appearance is loaded after the temporary default figure. Re-roll now so
	# a saved dress cannot inherit the default trousers figure's contrapposto
	# state and begin with its skirt visibly banked to one side.
	_roll_idle_pose()
	var loaded_skirt: Node3D = _figure.get("skirt")
	if loaded_skirt != null:
		var loaded_hips := _figure["hips"] as Node3D
		var loaded_pitch_pivot := _figure.get("skirt_pitch_pivot") as Node3D
		loaded_hips.rotation = Vector3.ZERO
		loaded_hips.scale = Vector3.ONE
		loaded_skirt.rotation = Vector3.ZERO
		loaded_skirt.scale = Vector3.ONE
		if loaded_pitch_pivot != null:
			loaded_pitch_pivot.basis = Basis.IDENTITY

func _build_camera(figure_height: float) -> void:
	_camera_rig = Node3D.new()
	_camera_rig.position = Vector3(0, figure_height * 0.87, 0)
	add_child(_camera_rig)
	_camera_pivot = Node3D.new()
	_camera_rig.add_child(_camera_pivot)
	var spring := SpringArm3D.new()
	spring.spring_length = 4.4
	spring.margin = 0.08
	spring.collision_mask = 1
	_camera_pivot.add_child(spring)
	_camera = Camera3D.new()
	_camera.current = true
	_camera.fov = 68.0
	spring.add_child(_camera)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED and not input_locked:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED and not input_locked:
		_yaw -= event.relative.x * MOUSE_SENSITIVITY
		_pitch = clampf(_pitch - event.relative.y * MOUSE_SENSITIVITY, -0.85, 0.42)
	# Touch has no pointer-lock/mouse_mode concept -- a drag reaches here at
	# all only because hub_ui.gd's own _input() already consumed (and marked
	# handled) any drag that started on one of the WASD touch buttons, so
	# anything arriving here as unhandled genuinely started elsewhere on
	# screen and is meant as a look gesture, same as mouse motion above.
	if event is InputEventScreenDrag and not input_locked:
		var drag := event as InputEventScreenDrag
		_yaw -= drag.relative.x * MOUSE_SENSITIVITY
		_pitch = clampf(_pitch - drag.relative.y * MOUSE_SENSITIVITY, -0.85, 0.42)
	if event.is_action_pressed("interact") and not input_locked:
		interact_requested.emit()

func _physics_process(delta: float) -> void:
	_camera_pivot.rotation = Vector3(_pitch, _yaw, 0)
	_update_head_look(delta)
	if input_locked:
		velocity.x = move_toward(velocity.x, 0.0, 18.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 18.0 * delta)
		_apply_gravity(delta)
		move_and_slide()
		_animate(delta, Vector2.ZERO)
		return

	var look := Input.get_vector("look_left", "look_right", "look_up", "look_down")
	_yaw -= look.x * GAMEPAD_LOOK_SPEED * delta
	_pitch = clampf(_pitch - look.y * GAMEPAD_LOOK_SPEED * delta, -0.85, 0.42)
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var camera_basis := Basis(Vector3.UP, _yaw)
	var direction3 := camera_basis * Vector3(input.x, 0, input.y)
	var speed := RUN_SPEED if Input.is_action_pressed("run") else WALK_SPEED
	if direction3.length_squared() > 0.001:
		direction3 = direction3.normalized()
		velocity.x = move_toward(velocity.x, direction3.x * speed, 20.0 * delta)
		velocity.z = move_toward(velocity.z, direction3.z * speed, 20.0 * delta)
		var target_yaw := atan2(direction3.x, direction3.z)
		_figure["root"].rotation.y = lerp_angle(_figure["root"].rotation.y, target_yaw, TURN_SPEED * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, 18.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 18.0 * delta)
	if is_on_floor() and Input.is_action_just_pressed("jump"):
		velocity.y = JUMP_VELOCITY
	_apply_gravity(delta)
	if is_on_floor() and not Input.is_action_just_pressed("jump"):
		_try_step_onto_prop()
	move_and_slide()
	if is_on_floor() and not _was_on_floor and velocity.y <= 0.0:
		_landing_timer = LANDING_DURATION
	_was_on_floor = is_on_floor()
	_animate(delta, input)

func _update_head_look(delta: float) -> void:
	# Solve the view direction in the rendered body's local basis. This is the
	# same camera-relative method used by Eleblorb, so orbiting the third-person
	# camera produces a neck turn rather than a world-axis rotation.
	var visual_root := _figure["root"] as Node3D
	var head := _figure["head"] as Node3D
	var local_camera_forward := visual_root.global_transform.basis.inverse() * -_camera.global_transform.basis.z
	var relative_yaw := atan2(local_camera_forward.x, local_camera_forward.z)

	# Once the camera passes the anatomical yaw limit, disengage tracking and
	# ease toward neutral instead of pinning the head at maximum twist.
	var tracking_engaged := absf(relative_yaw) <= HEAD_YAW_LIMIT
	var target_yaw := relative_yaw if tracking_engaged else 0.0
	var target_pitch := 0.0
	if tracking_engaged:
		# Positive local X pitches this procedural head downward, hence the
		# negated camera elevation and asymmetric up/down limits.
		target_pitch = clampf(
			-asin(clampf(local_camera_forward.y, -1.0, 1.0)),
			-HEAD_PITCH_UP_LIMIT,
			HEAD_PITCH_DOWN_LIMIT
		)

	head.rotation.y = lerp_angle(head.rotation.y, target_yaw, HEAD_TURN_SPEED * delta)
	head.rotation.x = lerp_angle(head.rotation.x, target_pitch, HEAD_TURN_SPEED * delta)

func _apply_gravity(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= 18.0 * delta

## Eleblorb's small-prop grace: probe the walkable top just ahead and pre-lift
## only when it is a low ordinary threshold. Taller fixtures still require a
## jump and side faces remain solid.
func _try_step_onto_prop() -> void:
	var horizontal := Vector3(velocity.x, 0.0, velocity.z)
	if horizontal.length() < 0.1:
		return
	var probe := global_position + horizontal.normalized() * STEP_LOOKAHEAD
	var space_state := get_world_3d().direct_space_state
	var from := Vector3(probe.x, global_position.y + PROP_STEP_MAX_HEIGHT + PROP_STEP_PROBE_CLEARANCE, probe.z)
	var to := Vector3(probe.x, global_position.y, probe.z)
	var query := PhysicsRayQueryParameters3D.create(from, to, 1)
	query.exclude = [self]
	var result := space_state.intersect_ray(query)
	if result.is_empty():
		return
	var hit_y: float = result.position.y
	var rise := hit_y - global_position.y
	if rise <= 0.02 or rise > PROP_STEP_MAX_HEIGHT:
		return
	global_position.y += rise
	velocity.y = 0.0

func _animate(delta: float, input: Vector2) -> void:
	var arm_left := _figure["arm_left"] as Node3D
	var arm_right := _figure["arm_right"] as Node3D
	var elbow_left := _figure["elbow_left"] as Node3D
	var elbow_right := _figure["elbow_right"] as Node3D
	var leg_left := _figure["leg_left"] as Node3D
	var leg_right := _figure["leg_right"] as Node3D
	var knee_left := _figure["knee_left"] as Node3D
	var knee_right := _figure["knee_right"] as Node3D
	var ankle_left := _figure["ankle_left"] as Node3D
	var ankle_right := _figure["ankle_right"] as Node3D
	var spine := _figure["spine"] as Node3D
	var hips := _figure["hips"] as Node3D
	# Flares the skirt's front-to-back depth (and, on a jump, lifts its hem)
	# in sync with the current pose so the legs don't clip through it --
	# eased back to its resting shape/position by default every frame; the
	# walk and jump branches below override this with their own pose-synced
	# values.
	var skirt: Node3D = _figure.get("skirt")
	var skirt_pitch_pivot: Node3D = _figure.get("skirt_pitch_pivot")
	if skirt != null:
		hips.scale.x = lerpf(hips.scale.x, 1.0, POSE_SETTLE_SPEED * delta)
		hips.scale.z = lerpf(hips.scale.z, 1.0, POSE_SETTLE_SPEED * delta)
		hips.rotation.x = lerp_angle(hips.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
		hips.rotation.y = lerp_angle(hips.rotation.y, 0.0, POSE_SETTLE_SPEED * delta)
		skirt.scale.x = lerpf(skirt.scale.x, 1.0, POSE_SETTLE_SPEED * delta)
		skirt.scale.z = lerpf(skirt.scale.z, 1.0, POSE_SETTLE_SPEED * delta)
		skirt.position.y = lerpf(skirt.position.y, _skirt_rest_y, POSE_SETTLE_SPEED * delta)
		skirt.rotation.x = lerp_angle(skirt.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
		skirt.rotation.y = lerp_angle(skirt.rotation.y, 0.0, POSE_SETTLE_SPEED * delta)
	if skirt_pitch_pivot != null:
		skirt_pitch_pivot.rotation.x = lerp_angle(skirt_pitch_pivot.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
		skirt_pitch_pivot.rotation.y = lerp_angle(skirt_pitch_pivot.rotation.y, 0.0, POSE_SETTLE_SPEED * delta)
		skirt_pitch_pivot.scale.x = lerpf(skirt_pitch_pivot.scale.x, 1.0, POSE_SETTLE_SPEED * delta)
		skirt_pitch_pivot.scale.z = lerpf(skirt_pitch_pivot.scale.z, 1.0, POSE_SETTLE_SPEED * delta)
	if not is_on_floor():
		var apex_fraction := 1.0 - smoothstep(0.0, JUMP_VELOCITY, absf(velocity.y))
		var t := JUMP_POSE_SETTLE_SPEED * delta
		var asymmetry := sin(_walk_phase)
		arm_left.rotation.x = lerp_angle(arm_left.rotation.x, -(JUMP_ARM_SWING - JUMP_ARM_ASYMMETRY * asymmetry), t)
		arm_right.rotation.x = lerp_angle(arm_right.rotation.x, -(JUMP_ARM_SWING + JUMP_ARM_ASYMMETRY * asymmetry), t)
		elbow_left.rotation.x = lerp_angle(elbow_left.rotation.x, -(JUMP_ELBOW_BEND - JUMP_ELBOW_ASYMMETRY * asymmetry), t)
		elbow_right.rotation.x = lerp_angle(elbow_right.rotation.x, -(JUMP_ELBOW_BEND + JUMP_ELBOW_ASYMMETRY * asymmetry), t)
		leg_left.rotation.x = lerp_angle(leg_left.rotation.x, -(JUMP_HIP_BEND - JUMP_HIP_ASYMMETRY * asymmetry) * apex_fraction, t)
		leg_right.rotation.x = lerp_angle(leg_right.rotation.x, -(JUMP_HIP_BEND + JUMP_HIP_ASYMMETRY * asymmetry) * apex_fraction, t)
		if skirt != null and skirt_pitch_pivot != null:
			# Follow the live mean hip-joint pitch directly. This keeps the
			# garment synchronized with both asymmetric legs without maintaining
			# a second, weaker approximation of their angle. Build that exact
			# pitch on top of the upper shell's full inverse basis: easing the
			# pivot toward an already-easing leg pose made the skirt visibly lag.
			var mean_hip_pitch := (leg_left.rotation.x + leg_right.rotation.x) * 0.5
			# Fit both skirt sections to the live airborne leg positions, just as
			# during a stride. Both shells follow the full live leg pitch.
			var upper_jump_envelope := FigureDress.upper_skirt_envelope(hips, leg_left, leg_right, knee_left, knee_right)
			hips.rotation.y = float(upper_jump_envelope["yaw"])
			# The ellipse solver intentionally has no ceiling for a walking
			# stride, but airborne points can approach its corner asymptote and
			# demand an enormous scale. Preserve the leg-driven fit direction
			# while bounding jump-only deformation to a garment-like range.
			hips.scale.x = clampf(float(upper_jump_envelope["scale_x"]), 0.82, 1.22)
			hips.scale.z = clampf(float(upper_jump_envelope["scale_z"]), 0.88, 1.28)
			hips.rotation.x = mean_hip_pitch
			var lower_jump_envelope := FigureDress.stride_envelope(skirt as MeshInstance3D, hips, knee_left, knee_right)
			skirt.rotation.y = float(lower_jump_envelope["yaw"])
			skirt.scale.x = clampf(float(lower_jump_envelope["scale_x"]), 0.82, 1.35)
			skirt.scale.z = clampf(float(lower_jump_envelope["scale_z"]), 0.88, 1.45)
			skirt.position.y = lerpf(skirt.position.y, _skirt_rest_y + apex_fraction * SKIRT_JUMP_HEM_LIFT, t)
			skirt_pitch_pivot.basis = hips.basis.inverse() * Basis(Vector3.RIGHT, mean_hip_pitch)
		knee_left.rotation.x = lerp_angle(knee_left.rotation.x, (JUMP_KNEE_BEND - JUMP_KNEE_ASYMMETRY * asymmetry) * apex_fraction, t)
		knee_right.rotation.x = lerp_angle(knee_right.rotation.x, (JUMP_KNEE_BEND + JUMP_KNEE_ASYMMETRY * asymmetry) * apex_fraction, t)
		ankle_left.rotation.x = lerp_angle(ankle_left.rotation.x, JUMP_ANKLE_EXTEND - JUMP_ANKLE_ASYMMETRY * asymmetry, t)
		ankle_right.rotation.x = lerp_angle(ankle_right.rotation.x, JUMP_ANKLE_EXTEND + JUMP_ANKLE_ASYMMETRY * asymmetry, t)
		return
	if _landing_timer > 0.0:
		_landing_timer -= delta
		var t := 16.0 * delta
		spine.rotation.x = lerp_angle(spine.rotation.x, deg_to_rad(12.0), t)
		spine.position.y = lerpf(spine.position.y, _spine_rest_y - 0.15, t)
		hips.position.y = lerpf(hips.position.y, _hips_rest_y - 0.15, t)
		knee_left.rotation.x = lerp_angle(knee_left.rotation.x, deg_to_rad(38.0), t)
		knee_right.rotation.x = lerp_angle(knee_right.rotation.x, deg_to_rad(38.0), t)
		if skirt != null and skirt_pitch_pivot != null:
			# Do not let contact switch the garment back to its independent
			# settling curve. Preserve the same exact live hip-angle relationship
			# throughout the impact crouch and its transition out of the jump.
			var impact_hip_pitch := (leg_left.rotation.x + leg_right.rotation.x) * 0.5
			skirt_pitch_pivot.basis = hips.basis.inverse() * Basis(Vector3.RIGHT, impact_hip_pitch)
		return
	var horizontal_speed := Vector2(velocity.x, velocity.z).length()
	if horizontal_speed > 0.1:
		_was_moving = true
		var sprinting := Input.is_action_pressed("run")
		var swing_speed := WALK_SWING_SPEED * (SPRINT_SWING_SPEED_SCALE if sprinting else 1.0)
		_walk_phase += delta * swing_speed * horizontal_speed
		var phase := _walk_phase + (SPRINT_STRIDE_EASE * sin(2.0 * _walk_phase) if sprinting else 0.0)
		var swing_amount := SPRINT_SWING_AMOUNT if sprinting else WALK_SWING_AMOUNT
		var bend_scale := SPRINT_BEND_SCALE if sprinting else 1.0
		var swing := sin(phase) * swing_amount
		leg_left.rotation.x = swing
		leg_right.rotation.x = -swing
		if skirt != null:
			var upper_envelope := FigureDress.upper_skirt_envelope(hips, leg_left, leg_right, knee_left, knee_right)
			hips.rotation.y = float(upper_envelope["yaw"])
			hips.scale.x = float(upper_envelope["scale_x"])
			hips.scale.z = float(upper_envelope["scale_z"])
			var envelope := FigureDress.stride_envelope(skirt as MeshInstance3D, hips, knee_left, knee_right)
			skirt.rotation.y = float(envelope["yaw"])
			skirt.scale.x = float(envelope["scale_x"])
			skirt.scale.z = float(envelope["scale_z"])
			# The lower segment is parented to the upper shell for vertical pose
			# tracking; cancel the shell's horizontal fit so each segment retains
			# the independently solved envelope appropriate to its own hem height.
			if skirt_pitch_pivot != null:
				# Rotation and non-uniform scale do not commute, so cancelling their
				# components separately changes the child's effective dimensions.
				# The full inverse basis exactly removes the upper shell transform.
				skirt_pitch_pivot.basis = hips.basis.inverse()
		arm_left.rotation.x = -swing
		arm_right.rotation.x = swing
		var left_knee := maxf(0.0, cos(phase + PI)) * ProceduralFigure.KNEE_BEND_AMOUNT * bend_scale
		var right_knee := maxf(0.0, cos(phase)) * ProceduralFigure.KNEE_BEND_AMOUNT * bend_scale
		if sprinting:
			left_knee += maxf(0.0, cos(phase)) * KNEE_STANCE_BEND_AMOUNT * bend_scale
			right_knee += maxf(0.0, cos(phase + PI)) * KNEE_STANCE_BEND_AMOUNT * bend_scale
		knee_left.rotation.x = left_knee
		knee_right.rotation.x = right_knee
		var right_forward := (1.0 - sin(phase)) * 0.5
		var left_forward := 1.0 - right_forward
		var elbow_floor := SPRINT_ELBOW_MIN_FRACTION if sprinting else 0.0
		var elbow_scale := bend_scale * (SPRINT_ELBOW_EXTRA_BEND if sprinting else 1.0)
		elbow_right.rotation.x = -(elbow_floor + right_forward * (1.0 - elbow_floor)) * ProceduralFigure.ELBOW_BEND_AMOUNT * elbow_scale
		elbow_left.rotation.x = -(elbow_floor + left_forward * (1.0 - elbow_floor)) * ProceduralFigure.ELBOW_BEND_AMOUNT * elbow_scale
		spine.rotation.x = lerp_angle(spine.rotation.x, SPINE_LEAN_MAX_RUN if sprinting else SPINE_LEAN_MAX_WALK, POSE_SETTLE_SPEED * delta)
		var body_offset := -RUN_BODY_BOB_AMOUNT * cos(2.0 * phase) if sprinting else -ProceduralFigure.WALK_BODY_DIP_AMOUNT * pow(sin(phase), 2)
		spine.position.y = _spine_rest_y + body_offset
		hips.position.y = _hips_rest_y + body_offset
		if sprinting:
			ankle_right.rotation.x = -ANKLE_DORSIFLEX_AMOUNT * maxf(0.0, -cos(phase)) + ANKLE_PLANTARFLEX_AMOUNT * maxf(0.0, -sin(phase))
			ankle_left.rotation.x = -ANKLE_DORSIFLEX_AMOUNT * maxf(0.0, cos(phase)) + ANKLE_PLANTARFLEX_AMOUNT * maxf(0.0, sin(phase))
	else:
		if _was_moving:
			_roll_idle_pose()
		_was_moving = false
		_settle_idle_pose(delta, arm_left, arm_right, elbow_left, elbow_right, leg_left, leg_right, knee_left, knee_right, ankle_left, ankle_right, spine, hips)

func _roll_idle_pose() -> void:
	_idle_elbow_left = -_rng.randf_range(IDLE_ELBOW_MIN, IDLE_ELBOW_MAX)
	_idle_elbow_right = -_rng.randf_range(IDLE_ELBOW_MIN, IDLE_ELBOW_MAX)
	# A rigid skirt should not be twisted by the weight-bearing hip drop used
	# for contrapposto -- same dress guard as HubNPC's own _roll_idle_pose().
	var wears_dress: bool = appearance_override.get("dress", false)
	_idle_leg_variant_active = not wears_dress and _rng.randf() < CONTRAPPOSTO_CHANCE
	_idle_bent_leg_side = 1.0 if _rng.randf() < 0.5 else -1.0
	_idle_knee_bend = _rng.randf_range(IDLE_KNEE_MIN, IDLE_KNEE_MAX)
	_idle_spine_counter = _idle_bent_leg_side * IDLE_SPINE_COUNTER_ANGLE if _idle_leg_variant_active else _rng.randf_range(-0.012, 0.012)
	_idle_body_twist = _rng.randf_range(-IDLE_BODY_TWIST_MAX, IDLE_BODY_TWIST_MAX)
	_idle_arm_left = _rng.randf_range(-IDLE_ARM_SWAY_MAX, IDLE_ARM_SWAY_MAX)
	_idle_arm_right = _rng.randf_range(-IDLE_ARM_SWAY_MAX, IDLE_ARM_SWAY_MAX)

func _settle_idle_pose(delta: float, arm_left: Node3D, arm_right: Node3D, elbow_left: Node3D, elbow_right: Node3D, leg_left: Node3D, leg_right: Node3D, knee_left: Node3D, knee_right: Node3D, ankle_left: Node3D, ankle_right: Node3D, spine: Node3D, hips: Node3D) -> void:
	var bent_knee := knee_right if _idle_bent_leg_side > 0.0 else knee_left
	var straight_knee := knee_left if _idle_bent_leg_side > 0.0 else knee_right
	var bent_leg := leg_right if _idle_bent_leg_side > 0.0 else leg_left
	var straight_leg := leg_left if _idle_bent_leg_side > 0.0 else leg_right
	var knee_target := _idle_knee_bend if _idle_leg_variant_active else 0.0
	var leg_z_target := signf(bent_leg.position.x) * IDLE_HIP_OUTWARD_ANGLE if _idle_leg_variant_active else 0.0
	var leg_y_target := signf(bent_leg.position.x) * IDLE_HIP_EXTERNAL_ROTATION if _idle_leg_variant_active else 0.0
	var hip_z_target := -_idle_bent_leg_side * IDLE_HIP_DROP_ANGLE if _idle_leg_variant_active else 0.0
	var t := POSE_SETTLE_SPEED * delta
	arm_left.rotation.x = lerp_angle(arm_left.rotation.x, _idle_arm_left, t)
	arm_right.rotation.x = lerp_angle(arm_right.rotation.x, _idle_arm_right, t)
	# Walking/sprinting drives the hip pivots on X. Ease both legs back under
	# the body before applying the resting stance, matching HubNPC's own
	# settle -- otherwise the player freezes mid-stride on stopping.
	bent_leg.rotation.x = lerp_angle(bent_leg.rotation.x, 0.0, t)
	straight_leg.rotation.x = lerp_angle(straight_leg.rotation.x, 0.0, t)
	bent_knee.rotation.x = lerp_angle(bent_knee.rotation.x, knee_target, t)
	straight_knee.rotation.x = lerp_angle(straight_knee.rotation.x, 0.0, t)
	bent_leg.rotation.z = lerp_angle(bent_leg.rotation.z, leg_z_target, t)
	straight_leg.rotation.z = lerp_angle(straight_leg.rotation.z, 0.0, t)
	bent_leg.rotation.y = lerp_angle(bent_leg.rotation.y, leg_y_target, t)
	straight_leg.rotation.y = lerp_angle(straight_leg.rotation.y, 0.0, t)
	hips.rotation.z = lerp_angle(hips.rotation.z, hip_z_target, t)
	spine.rotation.z = lerp_angle(spine.rotation.z, _idle_spine_counter, t)
	spine.rotation.y = lerp_angle(spine.rotation.y, _idle_body_twist, t)
	spine.rotation.x = lerp_angle(spine.rotation.x, 0.0, t)
	spine.position.y = lerpf(spine.position.y, _spine_rest_y, t)
	hips.position.y = lerpf(hips.position.y, _hips_rest_y, t)
	# The walk cycle leaves these bent (sometimes deeply, mid-sprint) -- the
	# previous flat reset skipped the elbows entirely, so they never eased
	# back out and stayed bent from whatever phase movement stopped at.
	elbow_left.rotation.x = lerp_angle(elbow_left.rotation.x, _idle_elbow_left, t)
	elbow_right.rotation.x = lerp_angle(elbow_right.rotation.x, _idle_elbow_right, t)
	ankle_left.rotation.x = lerp_angle(ankle_left.rotation.x, 0.0, t)
	ankle_right.rotation.x = lerp_angle(ankle_right.rotation.x, 0.0, t)
