extends Node2D

# 沙盘尺寸和位置
const TRAY_SIZE := Vector2(800, 500)
const TRAY_OFFSET := Vector2(100, 100)

# 物品数据：名称、颜色、初始位置
const ITEMS := [
	{ "name": "树", "color": Color(0.2, 0.6, 0.2), "pos": Vector2(200, 280) },
	{ "name": "人", "color": Color(0.8, 0.5, 0.2), "pos": Vector2(420, 320) },
	{ "name": "石头", "color": Color(0.5, 0.5, 0.5), "pos": Vector2(620, 260) },
]

# 拖拽状态
var _dragging: Node2D = null
var _drag_offset := Vector2.ZERO

func _ready() -> void:
	_create_sand_background()
	_create_items()

# ─── 创建沙盘背景 ───────────────────────────────────────────────
func _create_sand_background() -> void:
	var bg := ColorRect.new()
	bg.name = "SandBackground"
	bg.color = Color(0.87, 0.75, 0.50)          # 沙黄色
	bg.size = TRAY_SIZE
	bg.position = TRAY_OFFSET
	add_child(bg)

	# 边框（用 Polygon2D 画四条线效果）
	var border := ReferenceRect.new()
	border.position = TRAY_OFFSET
	border.size = TRAY_SIZE
	border.border_color = Color(0.6, 0.45, 0.2)
	border.border_width = 3.0
	border.editor_only = false                   # 运行时也显示
	add_child(border)

# ─── 批量创建物品 ───────────────────────────────────────────────
func _create_items() -> void:
	for data in ITEMS:
		var item := _make_item(data["name"], data["color"])
		item.position = data["pos"]
		add_child(item)

# ─── 构造单个可拖拽物品节点 ────────────────────────────────────
func _make_item(item_name: String, item_color: Color) -> Node2D:
	var root := Node2D.new()
	root.name = item_name
	root.set_meta("sandtray_item", true)        # 标记为沙盘物品

	# 外观：圆形 ColorRect 用 Polygon2D 代替更圆润
	var shape := Polygon2D.new()
	shape.color = item_color
	shape.polygon = _make_circle_polygon(32.0, 16)
	root.add_child(shape)

	# 文字标签
	var label := Label.new()
	label.text = item_name
	label.position = Vector2(-20, 38)
	label.add_theme_color_override("font_color", Color.BLACK)
	root.add_child(label)

	return root

# ─── 生成正多边形近似圆 ────────────────────────────────────────
func _make_circle_polygon(radius: float, points: int) -> PackedVector2Array:
	var verts := PackedVector2Array()
	for i in range(points):
		var angle := (TAU / points) * i
		verts.append(Vector2(cos(angle), sin(angle)) * radius)
	return verts

# ─── 拖拽逻辑 ─────────────────────────────────────────────────
func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				_try_pick_item(event.position)
			else:
				_drop_item()

	elif event is InputEventMouseMotion and _dragging:
		_dragging.position = event.position + _drag_offset
		# 限制在沙盘范围内
		_dragging.position = _dragging.position.clamp(
			TRAY_OFFSET + Vector2(32, 32),
			TRAY_OFFSET + TRAY_SIZE - Vector2(32, 32)
		)

func _try_pick_item(mouse_pos: Vector2) -> void:
	# 从上往下检测物品（后添加的在上层）
	for item in get_children():
		if not item.has_meta("sandtray_item"):
			continue
		if item.position.distance_to(mouse_pos) < 36.0:
			_dragging = item
			_drag_offset = item.position - mouse_pos
			# 把拣起的物品移到最上层
			move_child(item, get_child_count() - 1)
			return

func _drop_item() -> void:
	if _dragging:
		# 记录最终位置（可扩展为写入心理分析日志）
		print("[沙盘记录] %s 摆放于 %s" % [_dragging.name, _dragging.position])
		_dragging = null
