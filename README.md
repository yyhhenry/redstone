# Redstone

[随便玩电路](https://yyhhenry.github.io/redstone)

## 操作方法：

	单击或者框选可以选中若干个节点或线路，每一次选择操作会覆盖已选
	
	按住Shift之后，每一次选择操作会与已选XOR

	按住Ctrl单击空白处添加节点

	选中若干个个节点，按住Ctrl单击另一个节点连接电路，如果单击处没有节点，则新建一个节点

	选中若干个节点，按住鼠标左键拖动，可以移动节点

	选中若干个节点，敲击空格该节点打开/关闭电源

	选中一条线路，敲击空格该线路更改属性(导线/非门)和方向

	选中若干个节点或一条线路，敲击Delete删除
	
	滚轮控制放大缩小
	
	Ctrl+A全选，Ctrl+X剪切，Ctrl+C复制，Ctrl+V粘贴

## 其它细节：

	两个节点之间只能有一条线路

	导线可以**双向**传播电流，但是会逐渐削弱，串联大约30条导线后电流无法被捕捉
	
	非门测定较粗一端的电流，并将结果输送到较细一端，较细一端的状态**不会影响**较粗一端
	
	非门整流后，电流又可以传播30条导线长
	
	删除节点会把与它相接的边删除
	
	删除边不影响节点
	
	Ctrl+V后会自动选中内容以便继续进行移动或Ctrl+X
	
	按住Ctrl时会出现新元素指示，如果一条边提示为黄色则表示该条边已经存在
	
	如果一次添加操作完全无意义，新节点指示为黄色
	
	没有选中任何节点的时候，Ctrl+X或Ctrl+C无效