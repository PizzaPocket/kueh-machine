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

var input_locked := true
var _yaw := 0.0
var _pitch := -0.18
var _walk_phase := 0.0
var _figure: Dictionary
var _camera_pivot: Node3D
var _camera: Camera3D
var _spine_rest_y := 0.0
var _hips_rest_y := 0.0
var _was_on_floor := true
var _landing_timer := 0.0

func _ready() -> void:
	name = "Player"
	add_to_group("player")
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.38
	capsule.height = 2.1
	collision.shape = capsule
	collision.position.y = 1.05
	add_child(collision)
	_figure = FigureBuilder.build(self, {
		"height_scale": 1.12,
		"build_scale": 1.0,
		"skin": HubPalette.FAIR_SKIN,
		"hair": HubPalette.PLAYER_HAIR,
		"hair_style": FigureHair.STYLE_HERO,
		"is_female": false,
		"top": HubPalette.WHITE,
		"bottom": Color("777b80"),
		"shoes": HubPalette.BROWN_LEATHER,
	}, true)
	_spine_rest_y = (_figure["spine"] as Node3D).position.y
	_hips_rest_y = (_figure["hips"] as Node3D).position.y
	_build_camera()
	# Not captured here -- browsers require an actual user gesture (click,
	# keypress) before granting pointer lock, so requesting it immediately
	# on load always failed with a console "NotAllowedError: A user gesture
	# is required" and did nothing. _unhandled_input's own mouse-button
	# handler below already captures on the player's first real click.

func _build_camera() -> void:
	var rig := Node3D.new()
	rig.position = Vector3(0, 1.65, 0)
	add_child(rig)
	_camera_pivot = Node3D.new()
	rig.add_child(_camera_pivot)
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
		return
	var horizontal_speed := Vector2(velocity.x, velocity.z).length()
	if horizontal_speed > 0.1:
		var sprinting := Input.is_action_pressed("run")
		var swing_speed := WALK_SWING_SPEED * (SPRINT_SWING_SPEED_SCALE if sprinting else 1.0)
		_walk_phase += delta * swing_speed * horizontal_speed
		var phase := _walk_phase + (SPRINT_STRIDE_EASE * sin(2.0 * _walk_phase) if sprinting else 0.0)
		var swing_amount := SPRINT_SWING_AMOUNT if sprinting else WALK_SWING_AMOUNT
		var bend_scale := SPRINT_BEND_SCALE if sprinting else 1.0
		var swing := sin(phase) * swing_amount
		leg_left.rotation.x = swing
		leg_right.rotation.x = -swing
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
		for pivot in [arm_left, arm_right, leg_left, leg_right, knee_left, knee_right, ankle_left, ankle_right]:
			pivot.rotation.x = lerp_angle(pivot.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
		spine.rotation.x = lerp_angle(spine.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
		spine.position.y = lerpf(spine.position.y, _spine_rest_y, POSE_SETTLE_SPEED * delta)
		hips.position.y = lerpf(hips.position.y, _hips_rest_y, POSE_SETTLE_SPEED * delta)
