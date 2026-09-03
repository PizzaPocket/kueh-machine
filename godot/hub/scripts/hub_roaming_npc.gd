class_name HubRoamingNPC
extends HubNPC

const WALK_SPEED := 0.78
const TURN_SPEED := 4.8
const ARRIVE_DISTANCE := 0.24
const REST_TIME_MIN := 3.5
const REST_TIME_MAX := 7.5
const WALK_TIME_MIN := 4.0
const WALK_TIME_MAX := 8.0
const WALK_CYCLE_SPEED := 4.25
const WALK_KNEE_BEND := 0.42
const WALK_ELBOW_BEND := 0.48
const WALK_SPINE_LEAN := deg_to_rad(2.5)
const WALK_BODY_DIP := 0.007

## One or more separate rectangles the NPC picks random targets from -- e.g.
## an outdoor plaza strip plus a building's interior, connected only through
## its doorway. A single rect can't express that as one convex area, so
## instead of clamping to a rect every frame, movement targets are drawn
## from a randomly-chosen area each time, and only the loose union of all
## areas (_roam_clamp_rect) is used as a per-frame safety clamp -- letting
## the NPC walk freely through the gap between areas (e.g. the five-foot-way
## between the plaza and a shopfront) without being fenced out of it.
## Plain untyped Array (not Array[Rect2]) so every call site can pass a
## simple array literal without needing an explicit `as Array[Rect2]` cast.
var roam_areas: Array = [Rect2(-10.0, -10.0, 20.0, 20.0)]
## Parallel to roam_areas: door_waypoints[i] is an [outer, inner] pair of
## points -- straddling the actual wall plane on either side, not one point
## sitting inside its thickness -- that a walk must pass through in the
## right order when entering or leaving roam_areas[i] from the outdoor area
## (index 0), or null if area i needs no waypoint (area 0 itself, or a
## single-area NPC with nothing to route between). Without the outer/inner
## pair (a single mid-wall point), a walk from far off-axis could still clip
## the wall at an angle on its way to that one point; without any waypoint
## at all, a walk from the plaza straight to a random point inside a
## building could cross the shopfront's solid side panels instead of its
## door gap entirely.
var door_waypoints: Array = []
var _roam_clamp_rect := Rect2(-10.0, -10.0, 20.0, 20.0)
var _target := Vector2.ZERO
var _route: Array[Vector2] = []
var _rest_timer := 0.0
var _walk_timer := 0.0
var _walking := false
var _walk_phase := 0.0

func setup_roaming(data: Dictionary, player: Node3D, areas: Array, waypoints: Array = []) -> void:
	roam_areas = areas
	door_waypoints = waypoints
	_roam_clamp_rect = areas[0]
	for area in areas:
		_roam_clamp_rect = _roam_clamp_rect.merge(area)
	setup(data, player)
	add_to_group("roaming_hub_npc")
	# Enter the shared walk/rest loop at a different point for every NPC.
	# Their name-seeded RNG keeps this varied but stable between loads.
	_idle_phase = _rng.randf_range(0.0, TAU)
	_walk_phase = _rng.randf_range(0.0, TAU)
	if _rng.randf() < 0.48:
		_enter_rest(_rng.randf_range(0.8, REST_TIME_MAX))
		# Start visibly in the rolled resting stance instead of having everyone
		# ease out of the same neutral construction pose on the first frame.
		_settle_pose(1.0)
	else:
		_pick_target()
		# Likewise, begin walkers at their randomized point in the gait cycle.
		_set_walk_pose(1.0, sin(_walk_phase) * 0.44)

func _should_settle_idle_pose() -> bool:
	return not _walking

func _process(delta: float) -> void:
	super._process(delta)
	global_position.x = clampf(global_position.x, _roam_clamp_rect.position.x, _roam_clamp_rect.end.x)
	global_position.z = clampf(global_position.z, _roam_clamp_rect.position.y, _roam_clamp_rect.end.y)
	if _walking:
		_walk_timer -= delta
		var here := Vector2(global_position.x, global_position.z)
		var toward := _target - here
		if toward.length() <= ARRIVE_DISTANCE:
			if not _route.is_empty():
				# Reached a waypoint, not the final destination -- continue
				# on to the next leg instead of resting mid-route (which
				# could leave the NPC standing inside a doorway gap).
				_target = _route.pop_front()
				_walk_timer = _rng.randf_range(WALK_TIME_MIN, WALK_TIME_MAX)
				return
			_enter_rest(_rng.randf_range(REST_TIME_MIN, REST_TIME_MAX))
			return
		if _walk_timer <= 0.0:
			_enter_rest(_rng.randf_range(REST_TIME_MIN, REST_TIME_MAX))
			return
		# Door routes are deliberately aligned with the opening's outer/inner
		# waypoints. Lateral separation steering here can pull an NPC off that
		# narrow safe line and into the solid shopfront panel between the gallery
		# and restaurant doors. While any routed waypoint remains, keep the lane
		# authoritative; ordinary walks still use separation as before.
		var direction := toward.normalized()
		if _route.is_empty():
			direction = (direction + _separation_steering()).normalized()
		var proposed := global_position + Vector3(direction.x, 0, direction.y) * WALK_SPEED * delta
		if not _can_move_to(proposed):
			_enter_rest(_rng.randf_range(1.0, 2.2))
			return
		global_position = proposed
		# AI/movement (target picking, timers, global_position above) stays
		# unconditional -- only the per-bone walk-cycle animation below is
		# distance-gated (see HubNPC's own _far_from_player()/its doc
		# comment), so a far-away NPC keeps walking its route correctly and
		# is just visibly mid-stride whenever the player next gets close.
		if not _far_from_player():
			var root := _figure["root"] as Node3D
			root.rotation.y = lerp_angle(root.rotation.y, atan2(direction.x, direction.y), TURN_SPEED * delta)
			_walk_phase += delta * WALK_CYCLE_SPEED
			_set_walk_pose(delta, sin(_walk_phase) * 0.44)
	else:
		_rest_timer -= delta
		# HubNPC's process has already eased toward the idle pose rolled when
		# this rest began. Do not overwrite it with the neutral walk pose.
		var resting_hips := _figure["hips"] as Node3D
		var resting_skirt: Node3D = _figure.get("skirt")
		if resting_skirt != null and not _far_from_player():
			var settle := POSE_SETTLE_SPEED * delta
			resting_hips.scale.x = lerpf(resting_hips.scale.x, 1.0, settle)
			resting_hips.scale.z = lerpf(resting_hips.scale.z, 1.0, settle)
			resting_hips.rotation.y = lerp_angle(resting_hips.rotation.y, 0.0, settle)
			resting_skirt.scale.x = lerpf(resting_skirt.scale.x, 1.0, settle)
			resting_skirt.scale.z = lerpf(resting_skirt.scale.z, 1.0, settle)
			resting_skirt.rotation.y = lerp_angle(resting_skirt.rotation.y, 0.0, settle)
			var resting_pitch_pivot: Node3D = _figure.get("skirt_pitch_pivot")
			if resting_pitch_pivot != null:
				# The lower skirt independently fits the stride beneath a rotated,
				# non-uniformly scaled upper shell. Keep cancelling that shell's full
				# live basis while it settles; decomposing the old inverse into Euler
				# rotation/scale channels can choose a wildly different equivalent
				# transform for one frame, producing the visible transition flash.
				resting_pitch_pivot.basis = resting_hips.basis.inverse()
		if _rest_timer <= 0.0:
			_pick_target()

func _separation_steering() -> Vector2:
	var steering := Vector2.ZERO
	for other_node in get_tree().get_nodes_in_group("roaming_hub_npc"):
		var other := other_node as Node3D
		if other == null or other == self:
			continue
		var offset := Vector2(global_position.x - other.global_position.x, global_position.z - other.global_position.z)
		var distance := offset.length()
		if distance < 1.25:
			if distance < 0.01:
				offset = Vector2(1.0 if get_instance_id() > other.get_instance_id() else -1.0, 0.0)
				distance = 0.01
			steering += offset.normalized() * (1.25 - distance) * 1.8
	return steering

## Radius from a pillar's own center a roaming NPC won't cross into: the
## pillar's own half-diagonal (PILLAR_HALF_WIDTH * sqrt(2) =~ 0.34) plus
## roughly an NPC's own collision capsule radius (hub_npc.gd's own
## 0.38 * build_scale), rounded up for a clean margin.
const PILLAR_AVOID_RADIUS := 0.7
## Computed once and shared across every roaming NPC instance (a static var,
## not per-instance) -- there's nothing NPC-specific about where the
## pillars are, so there's no reason to rebuild this list per NPC, let alone
## every frame each one calls _can_move_to().
static var _pillar_positions: Array[Vector2] = []
static var _pillar_positions_ready := false

func _can_move_to(proposed: Vector3) -> bool:
	for other_node in get_tree().get_nodes_in_group("roaming_hub_npc"):
		var other := other_node as Node3D
		if other == null or other == self:
			continue
		if Vector2(proposed.x - other.global_position.x, proposed.z - other.global_position.z).length() < 0.82:
			return false
	if not _pillar_positions_ready:
		_pillar_positions = ShophouseStreet.pillar_positions()
		_pillar_positions_ready = true
	var proposed_xz := Vector2(proposed.x, proposed.z)
	for pillar in _pillar_positions:
		if proposed_xz.distance_to(pillar) < PILLAR_AVOID_RADIUS:
			return false
	return true

## By convention, roam_areas[0] is the connecting "outdoor" zone and every
## other entry is a separate building's interior, reachable only through it.
## If the next target were picked uniformly from every area regardless of
## where the NPC currently stands, a walk from inside one building straight
## to inside another would cross whatever real wall separates them (they
## don't share a border with the outdoor area, so nothing routes the walk
## back out through a doorway first). Forcing area 0 whenever currently
## inside any non-zero area guarantees the only way from one interior to
## another is back out to the outdoor zone and back in through a doorway.
func _pick_target() -> void:
	var here := Vector2(global_position.x, global_position.z)
	var current_area := 0
	if roam_areas.size() > 1:
		for i in range(1, roam_areas.size()):
			if (roam_areas[i] as Rect2).has_point(here):
				current_area = i
				break
	# Only ever pick a different area than the current one when already
	# outdoors (area 0) -- from inside a building the only allowed next area
	# is back out to 0, so two interiors are never a direct target of each
	# other (see class doc comment on door_waypoints for why).
	var area_index := 0 if current_area != 0 else _rng.randi_range(0, roam_areas.size() - 1)
	var area: Rect2 = roam_areas[area_index]
	var final_target := Vector2(
		_rng.randf_range(area.position.x, area.end.x),
		_rng.randf_range(area.position.y, area.end.y)
	)
	_route.clear()
	if current_area != area_index:
		# Leaving area i: walk from inner (already inside) out to outer.
		var leaving_pair = door_waypoints[current_area] if current_area < door_waypoints.size() else null
		if leaving_pair != null:
			_route.append(leaving_pair[1])
			_route.append(leaving_pair[0])
		# Entering area i: walk from outer (still outside) in to inner.
		var entering_pair = door_waypoints[area_index] if area_index < door_waypoints.size() else null
		if entering_pair != null:
			_route.append(entering_pair[0])
			_route.append(entering_pair[1])
	_route.append(final_target)
	_target = _route.pop_front()
	_walk_timer = _rng.randf_range(WALK_TIME_MIN, WALK_TIME_MAX)
	_walking = true

func pause_for_interaction() -> void:
	_enter_rest(4.5)

func _enter_rest(duration: float) -> void:
	_walking = false
	_rest_timer = duration
	# Eleblorb rolls a new stance at every walk-to-idle transition rather than
	# leaving every stop in the same pose for the NPC's whole lifetime.
	_roll_idle_pose()

func _set_walk_pose(delta: float, swing: float) -> void:
	# setup_roaming() deliberately passes 1.0 to establish a randomized walk
	# pose immediately. This blend must therefore saturate at 1: the previous
	# weight of 8 extrapolated every joint far beyond the authored gait on the
	# first frame (and could do so again after a long frame), while the player
	# gait assigns its stride directly and never has that failure mode.
	var settle := minf(1.0, POSE_SETTLE_SPEED * delta)
	var arm_left := _figure["arm_left"] as Node3D
	var arm_right := _figure["arm_right"] as Node3D
	var leg_left := _figure["leg_left"] as Node3D
	var leg_right := _figure["leg_right"] as Node3D
	var knee_left := _figure["knee_left"] as Node3D
	var knee_right := _figure["knee_right"] as Node3D
	var elbow_left := _figure["elbow_left"] as Node3D
	var elbow_right := _figure["elbow_right"] as Node3D
	var hips := _figure["hips"] as Node3D
	var spine := _figure["spine"] as Node3D
	arm_left.rotation.x = lerp_angle(arm_left.rotation.x, -swing, settle)
	arm_right.rotation.x = lerp_angle(arm_right.rotation.x, swing, settle)
	leg_left.rotation.x = lerp_angle(leg_left.rotation.x, swing, settle)
	leg_right.rotation.x = lerp_angle(leg_right.rotation.x, -swing, settle)
	# As in Eleblorb, knees follow stride velocity rather than copying the hip
	# angle. That places each bend during leg recovery and avoids a stiff march.
	knee_left.rotation.x = lerp_angle(knee_left.rotation.x, maxf(0.0, cos(_walk_phase + PI)) * WALK_KNEE_BEND, settle)
	knee_right.rotation.x = lerp_angle(knee_right.rotation.x, maxf(0.0, cos(_walk_phase)) * WALK_KNEE_BEND, settle)
	# Walking always starts from a level pelvis and parallel leg axes. These are
	# the channels the idle contrapposto changes but a basic X-axis walk cycle
	# would otherwise leave behind.
	leg_left.rotation.y = lerp_angle(leg_left.rotation.y, 0.0, settle)
	leg_right.rotation.y = lerp_angle(leg_right.rotation.y, 0.0, settle)
	leg_left.rotation.z = lerp_angle(leg_left.rotation.z, 0.0, settle)
	leg_right.rotation.z = lerp_angle(leg_right.rotation.z, 0.0, settle)
	hips.rotation.z = lerp_angle(hips.rotation.z, 0.0, settle)
	spine.rotation.x = lerp_angle(spine.rotation.x, WALK_SPINE_LEAN, settle)
	spine.rotation.z = lerp_angle(spine.rotation.z, 0.0, settle)
	spine.rotation.y = lerp_angle(spine.rotation.y, 0.0, settle)
	var right_arm_forward := (1.0 - sin(_walk_phase)) * 0.5
	var left_arm_forward := 1.0 - right_arm_forward
	elbow_left.rotation.x = lerp_angle(elbow_left.rotation.x, -left_arm_forward * WALK_ELBOW_BEND, settle)
	elbow_right.rotation.x = lerp_angle(elbow_right.rotation.x, -right_arm_forward * WALK_ELBOW_BEND, settle)
	var body_dip := -WALK_BODY_DIP * pow(sin(_walk_phase), 2)
	spine.position.y = _spine_rest_y + body_dip
	hips.position.y = _hips_rest_y + body_dip
	var skirt: Node3D = _figure.get("skirt")
	if skirt != null:
		# Apply the envelopes directly from the already-settled live leg pose,
		# just as the player does. Easing the garment toward these values lets
		# it lag behind the stride and briefly defeats the containment solve.
		var upper_envelope := FigureDress.upper_skirt_envelope(hips, leg_left, leg_right, knee_left, knee_right)
		hips.rotation.y = float(upper_envelope["yaw"])
		hips.scale.x = float(upper_envelope["scale_x"])
		hips.scale.z = float(upper_envelope["scale_z"])
		var envelope := FigureDress.stride_envelope(skirt as MeshInstance3D, hips, knee_left, knee_right)
		skirt.rotation.y = float(envelope["yaw"])
		skirt.scale.x = float(envelope["scale_x"])
		skirt.scale.z = float(envelope["scale_z"])
		var skirt_pitch_pivot: Node3D = _figure.get("skirt_pitch_pivot")
		if skirt_pitch_pivot != null:
			skirt_pitch_pivot.basis = hips.basis.inverse()
