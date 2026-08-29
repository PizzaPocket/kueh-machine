class_name HubConveyorItem
extends Node3D

var minimum_x := 0.0
var maximum_x := 0.0
var speed := 0.0

func setup(start: Vector3, min_x: float, max_x: float, movement_speed: float) -> void:
	position = start
	minimum_x = min_x
	maximum_x = max_x
	speed = movement_speed

func _process(delta: float) -> void:
	position.x += speed * delta
	if speed > 0.0 and position.x > maximum_x:
		position.x = minimum_x
	elif speed < 0.0 and position.x < minimum_x:
		position.x = maximum_x
