class_name HubNPC
extends Node3D

const HEAD_YAW_LIMIT := deg_to_rad(55.0)
const HEAD_TURN_SPEED := 7.0
const POSE_SETTLE_SPEED := 8.0
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

var contributor: Dictionary
var _head: Node3D
var _player: Node3D
var _idle_phase := 0.0
var _figure: Dictionary
var _eyes: Array = []
var _eye_blink := EyeBlink.new_state()
var _rng := RandomNumberGenerator.new()
var _idle_elbow_left := 0.0
var _idle_elbow_right := 0.0
var _idle_leg_variant_active := false
var _idle_bent_leg_side := 1.0
var _idle_knee_bend := 0.0
var _idle_spine_counter := 0.0
var _idle_body_twist := 0.0
var _idle_arm_left := 0.0
var _idle_arm_right := 0.0
var _spine_rest_y := 0.0
var _hips_rest_y := 0.0
var _collision: CollisionShape3D

func setup(data: Dictionary, player: Node3D) -> void:
	contributor = data
	_player = player
	name = data["name"].replace(" ", "")
	_rng.seed = contributor["name"].hash()
	_figure = FigureBuilder.build(self, data["appearance"])
	_head = _figure["head"]
	_eyes = _figure["eyes"]
	_spine_rest_y = (_figure["spine"] as Node3D).position.y
	_hips_rest_y = (_figure["hips"] as Node3D).position.y
	# The contributors form a perimeter around the hub. Aim each full figure
	# at the center of that configuration; head tracking remains independent
	# and can still acknowledge a nearby player.
	var inward := Vector3.ZERO - global_position
	var inward_yaw := atan2(inward.x, inward.z)
	_figure["root"].rotation.y = data.get("facing", inward_yaw)
	_roll_idle_pose()
	var body := StaticBody3D.new()
	body.collision_layer = 1
	_collision = CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.38 * data["appearance"].get("build_scale", 1.0)
	capsule.height = maxf(0.76, float(_figure.get("total_height", 1.8)))
	_collision.shape = capsule
	_collision.position.y = capsule.height * 0.5
	body.add_child(_collision)
	add_child(body)

func apply_appearance(new_appearance: Dictionary) -> void:
	contributor["appearance"] = new_appearance.duplicate(true)
	var old_root := _figure.get("root") as Node3D
	var facing := old_root.rotation.y if old_root != null else 0.0
	if old_root != null:
		remove_child(old_root)
		old_root.queue_free()
	_figure = FigureBuilder.build(self, contributor["appearance"])
	_head = _figure["head"]
	_eyes = _figure["eyes"]
	_spine_rest_y = (_figure["spine"] as Node3D).position.y
	_hips_rest_y = (_figure["hips"] as Node3D).position.y
	(_figure["root"] as Node3D).rotation.y = facing
	if _collision != null:
		var capsule := _collision.shape as CapsuleShape3D
		capsule.radius = 0.38 * new_appearance.get("build_scale", 1.0)
		capsule.height = maxf(capsule.radius * 2.0, float(_figure.get("total_height", 1.8)))
		_collision.position.y = capsule.height * 0.5
	_roll_idle_pose()

func _process(delta: float) -> void:
	_idle_phase += delta
	if _should_settle_idle_pose():
		_settle_pose(delta)
	EyeBlink.apply(_eye_blink, delta, _eyes)
	if _player == null or _head == null:
		return
	var distance := global_position.distance_to(_player.global_position)
	var target_yaw := 0.0
	if distance < 4.25:
		var parent := _head.get_parent() as Node3D
		var local_target := parent.global_transform.affine_inverse() * _player.global_position
		var direction := local_target - _head.position
		target_yaw = clampf(atan2(direction.x, direction.z), -HEAD_YAW_LIMIT, HEAD_YAW_LIMIT)
	_head.rotation.y = lerp_angle(_head.rotation.y, target_yaw, HEAD_TURN_SPEED * delta)
	_head.rotation.z = sin(_idle_phase * 0.7 + global_position.x) * 0.012

func _should_settle_idle_pose() -> bool:
	return true

func _roll_idle_pose() -> void:
	_idle_elbow_left = -_rng.randf_range(IDLE_ELBOW_MIN, IDLE_ELBOW_MAX)
	_idle_elbow_right = -_rng.randf_range(IDLE_ELBOW_MIN, IDLE_ELBOW_MAX)
	# A rigid skirt should not be twisted by the weight-bearing hip drop used
	# for contrapposto. Dress wearers keep the softer relaxed stance instead.
	var wears_dress: bool = contributor["appearance"].get("dress", false)
	_idle_leg_variant_active = not wears_dress and _rng.randf() < CONTRAPPOSTO_CHANCE
	_idle_bent_leg_side = 1.0 if _rng.randf() < 0.5 else -1.0
	_idle_knee_bend = _rng.randf_range(IDLE_KNEE_MIN, IDLE_KNEE_MAX)
	_idle_spine_counter = _idle_bent_leg_side * IDLE_SPINE_COUNTER_ANGLE if _idle_leg_variant_active else _rng.randf_range(-0.012, 0.012)
	_idle_body_twist = _rng.randf_range(-IDLE_BODY_TWIST_MAX, IDLE_BODY_TWIST_MAX)
	_idle_arm_left = _rng.randf_range(-IDLE_ARM_SWAY_MAX, IDLE_ARM_SWAY_MAX)
	_idle_arm_right = _rng.randf_range(-IDLE_ARM_SWAY_MAX, IDLE_ARM_SWAY_MAX)

func _settle_pose(delta: float) -> void:
	var bent_knee: Node3D = _figure["knee_right"] if _idle_bent_leg_side > 0.0 else _figure["knee_left"]
	var straight_knee: Node3D = _figure["knee_left"] if _idle_bent_leg_side > 0.0 else _figure["knee_right"]
	var bent_leg: Node3D = _figure["leg_right"] if _idle_bent_leg_side > 0.0 else _figure["leg_left"]
	var straight_leg: Node3D = _figure["leg_left"] if _idle_bent_leg_side > 0.0 else _figure["leg_right"]
	var knee_target := _idle_knee_bend if _idle_leg_variant_active else 0.0
	var leg_z_target := signf(bent_leg.position.x) * IDLE_HIP_OUTWARD_ANGLE if _idle_leg_variant_active else 0.0
	var leg_y_target := signf(bent_leg.position.x) * IDLE_HIP_EXTERNAL_ROTATION if _idle_leg_variant_active else 0.0
	var hip_z_target := -_idle_bent_leg_side * IDLE_HIP_DROP_ANGLE if _idle_leg_variant_active else 0.0
	var arm_left: Node3D = _figure["arm_left"]
	var arm_right: Node3D = _figure["arm_right"]
	var elbow_left: Node3D = _figure["elbow_left"]
	var elbow_right: Node3D = _figure["elbow_right"]
	var hips: Node3D = _figure["hips"]
	var spine: Node3D = _figure["spine"]
	arm_left.rotation.x = lerp_angle(arm_left.rotation.x, _idle_arm_left, POSE_SETTLE_SPEED * delta)
	arm_right.rotation.x = lerp_angle(arm_right.rotation.x, _idle_arm_right, POSE_SETTLE_SPEED * delta)
	# Walking drives the hip pivots on X. Ease both legs back under the body
	# before applying the resting stance; otherwise an NPC freezes with one
	# foot forward and one behind at whatever phase the walk cycle stopped.
	bent_leg.rotation.x = lerp_angle(bent_leg.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
	straight_leg.rotation.x = lerp_angle(straight_leg.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
	bent_knee.rotation.x = lerp_angle(bent_knee.rotation.x, knee_target, POSE_SETTLE_SPEED * delta)
	straight_knee.rotation.x = lerp_angle(straight_knee.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
	bent_leg.rotation.z = lerp_angle(bent_leg.rotation.z, leg_z_target, POSE_SETTLE_SPEED * delta)
	straight_leg.rotation.z = lerp_angle(straight_leg.rotation.z, 0.0, POSE_SETTLE_SPEED * delta)
	bent_leg.rotation.y = lerp_angle(bent_leg.rotation.y, leg_y_target, POSE_SETTLE_SPEED * delta)
	straight_leg.rotation.y = lerp_angle(straight_leg.rotation.y, 0.0, POSE_SETTLE_SPEED * delta)
	hips.rotation.z = lerp_angle(hips.rotation.z, hip_z_target, POSE_SETTLE_SPEED * delta)
	spine.rotation.z = lerp_angle(spine.rotation.z, _idle_spine_counter, POSE_SETTLE_SPEED * delta)
	spine.rotation.y = lerp_angle(spine.rotation.y, _idle_body_twist, POSE_SETTLE_SPEED * delta)
	spine.rotation.x = lerp_angle(spine.rotation.x, 0.0, POSE_SETTLE_SPEED * delta)
	spine.position.y = lerpf(spine.position.y, _spine_rest_y, POSE_SETTLE_SPEED * delta)
	hips.position.y = lerpf(hips.position.y, _hips_rest_y, POSE_SETTLE_SPEED * delta)
	elbow_left.rotation.x = lerp_angle(elbow_left.rotation.x, _idle_elbow_left, POSE_SETTLE_SPEED * delta)
	elbow_right.rotation.x = lerp_angle(elbow_right.rotation.x, _idle_elbow_right, POSE_SETTLE_SPEED * delta)
	# Eases a stride-flared skirt (see HubRoamingNPC._set_walk_pose()) back
	# to its resting depth once the legs are back under the body.
	var skirt: Node3D = _figure.get("skirt")
	if skirt != null:
		skirt.scale.z = lerpf(skirt.scale.z, 1.0, POSE_SETTLE_SPEED * delta)
