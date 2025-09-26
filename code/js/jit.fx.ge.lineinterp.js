inlets = 1;
outlettypes = ["jit_gl_texture"];

include("jit.fx.include.js");

var inTex = new JitterObject("jit.gl.texture", drawto);
inTex.rectangle = 1;
inTex.type = "float32";
inTex.filter = "nearest";
fxobs.push(inTex);

var inTex2 = new JitterObject("jit.gl.texture", drawto);
inTex2.rectangle = 1;
inTex2.type = "float32";
inTex2.filter = "nearest";
fxobs.push(inTex2);

//var fdbkTex = new JitterObject("jit.gl.texture", drawto);
fdbkTex.rectangle = 1;
fdbkTex.type = "float32";
fdbkTex.filter = "nearest";
//fxobs.push(fdbkTex);

slab.file = "jit.fx.ge.lineinterp.threshold.jxs";
slab.inputs = 1;
slab.type = "float32";
slab.rectangle = 1;
slab.automatic = 0;
let slab_threshold = slab;
fxobs.push(slab_threshold);

var slab_transitions = new JitterObject("jit.gl.slab", drawto);
slab_transitions.file = "jit.fx.ge.lineinterp.find.transitions.jxs";
slab_transitions.inputs = 1;
slab_transitions.type = "float32";
slab_transitions.rectangle = 1;
slab_transitions.automatic = 0;
fxobs.push(slab_transitions);

var inMat = new JitterMatrix(3, "float32", 1, 1);

var node_startend = new JitterObject("jit.gl.node", drawto);
node_startend.adapt = 0;
node_startend.type = "float32";
node_startend.dim = [1, 1];
node_startend.erase_color = [0,0,0,0];
node_startend.capture = 1;
node_startend.rectangle = 1;
node_startend.automatic = 0;
fxobs.push(node_startend);

var shader_startend = new JitterObject("jit.gl.shader", drawto);
shader_startend.file = "jit.fx.ge.lineinterp.find.start.end.jxs";
fxobs.push(shader_startend);

var mesh_startend = new JitterObject("jit.gl.mesh", node_startend.name);
mesh_startend.draw_mode = "points";
mesh_startend.texture = slab_transitions.out_name;
mesh_startend.shader = shader_startend.name;
mesh_startend.blend_enable = 0;
mesh_startend.depth_enable = 1;

var slab_combine = new JitterObject("jit.gl.slab", drawto);
slab_combine.file = "jit.fx.ge.lineinterp.combine.start.stop.jxs";
slab_combine.inputs = 2;
slab_combine.type = "float32";
slab_combine.rectangle = 1;
slab_combine.automatic = 0;
fxobs.push(slab_combine);

var node_makeline = new JitterObject("jit.gl.node", drawto);
node_makeline.adapt = 0;
node_makeline.type = "float32";
node_makeline.dim = [1, 1];
node_makeline.erase_color = [0,0,0,0];
node_makeline.capture = 1;
node_makeline.rectangle = 1;
node_makeline.automatic = 0;
fxobs.push(node_makeline);

var shader_makeline = new JitterObject("jit.gl.shader", drawto);
shader_makeline.file = "jit.fx.ge.lineinterp.make.line.jxs";
fxobs.push(shader_makeline);

var mesh_makeline = new JitterObject("jit.gl.mesh", node_makeline.name);
mesh_makeline.draw_mode = "points";
mesh_makeline.texture = [	inTex.name, 
							inTex2.name
						];
mesh_makeline.shader = shader_makeline.name;

var slab_composite = new JitterObject("jit.gl.slab", drawto);
slab_composite.file = "jit.fx.ge.lineinterp.composite.jxs";
slab_composite.inputs = 2;
slab_composite.type = "float32";
slab_composite.automatic = 0;
fxobs.push(slab_composite);

var range = [0.0, 0.5];
declareattribute("range", null, "setrange", 0);
function setrange(){ 
	range = [ arguments[0], arguments[1] ];
	slab_threshold.param("range", range);
}

var dimmode = 0;
declareattribute("dimmode", null, "setdimmode", 0);
function setdimmode(v){ 
	dimmode = Math.max(0, Math.min(3, v));
	slab_transitions.param("dimmode", dimmode);
	shader_startend.param("dimmode", dimmode);
}

var colormode = 0;
declareattribute("colormode", null, "setcolormode", 0);
function setcolormode(v){ 
	colormode = Math.max(0, Math.min(2, v));
	shader_makeline.param("colormode", colormode);
}

var rangemode = 0;
declareattribute("rangemode", null, "setrangemode", 0);
function setrangemode(v){ 
	rangemode = Math.max(0, Math.min(7, v));
	slab_threshold.param("rangemode", rangemode);
}

var outputmode = 0;
declareattribute("outputmode", null, "setoutputmode", 0);
function setoutputmode(v){ 
	outputmode = v;
}

function update_dim(){

	if(inMat.dim[0] != inTex.dim[0] || inMat.dim[1] != inTex.dim[1]){
		inMat.dim = inTex.dim.slice(0, 2);
		node_startend.dim = inMat.dim;
		node_makeline.dim = inMat.dim;
		inMat.exprfill(0, "norm[0]");
		inMat.exprfill(1, "norm[1]");
		mesh_startend.jit_matrix(inMat.name);
		mesh_makeline.jit_matrix(inMat.name);
	}
}

function drawfx(inname){

	inTex.jit_gl_texture(inname);

	update_dim();

	slab_threshold.jit_gl_texture(inTex.name);
	slab_threshold.draw();

	slab_transitions.jit_gl_texture(slab_threshold.out_name);
	slab_transitions.draw();

	node_startend.draw();

	slab_combine.activeinput = 1;
	slab_combine.jit_gl_texture(node_startend.out_name);
	slab_combine.activeinput = 0;
	slab_combine.jit_gl_texture(slab_transitions.out_name);
	slab_combine.draw();

	inTex2.jit_gl_texture(slab_combine.out_name);

	node_makeline.draw();

	if(outputmode == 0){
		slab_composite.activeinput = 1;
		slab_composite.jit_gl_texture(node_makeline.out_name);
		slab_composite.activeinput = 0;
		slab_composite.jit_gl_texture(fdbkTex.name);
		slab_composite.draw();
	
		outlet(0, "jit_gl_texture", slab_composite.out_name);		
	} else {
		outlet(0, "jit_gl_texture", node_makeline.out_name);		
	}

	fdbkTex.jit_gl_texture(inTex.name);
}