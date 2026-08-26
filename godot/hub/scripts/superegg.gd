class_name Superegg
extends RefCounted

static func mesh(radius: float, height: float, exponent := 2.8, rings := 16, segments := 24) -> ArrayMesh:
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()
	var indices := PackedInt32Array()
	for ring in range(rings + 1):
		var v := float(ring) / rings
		var y_norm := lerpf(-1.0, 1.0, v)
		var radial := pow(maxf(0.0, 1.0 - pow(absf(y_norm), exponent)), 1.0 / exponent)
		for segment in range(segments + 1):
			var angle := TAU * float(segment) / segments
			var normal := Vector3(cos(angle) * radial, y_norm, sin(angle) * radial).normalized()
			vertices.append(Vector3(cos(angle) * radius * radial, y_norm * height * 0.5, sin(angle) * radius * radial))
			normals.append(normal)
	for ring in range(rings):
		for segment in range(segments):
			var current := ring * (segments + 1) + segment
			var next := current + segments + 1
			indices.append_array(PackedInt32Array([current, next, current + 1, current + 1, next, next + 1]))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_INDEX] = indices
	var result := ArrayMesh.new()
	result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return result

