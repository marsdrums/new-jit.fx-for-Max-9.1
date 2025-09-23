inlets = 1;
outlettypes = ["jit_gl_texture"];

include("jit.fx.include.js");

var salb_resolve = new JitterObject("jit.gl.slab", drawto);
salb_resolve.file = "jit.fx.ge.pattern.resolve.jxs";
salb_resolve.inputs = 1;
salb_resolve.type = "float32";
fxobs.push(salb_resolve);

var inTex = new JitterObject("jit.gl.texture", drawto);
inTex.type = "float32";
fxobs.push(inTex);

var node_vor = new JitterObject("jit.gl.node", drawto);
node_vor.adapt = 0;
node_vor.capture = 1;
node_vor.erase_color = [0,0,0,0];
node_vor.dim = [1920, 1080];
node_vor.type = "float32";
fxobs.push(node_vor);

var node_del = new JitterObject("jit.gl.node", drawto);
node_del.adapt = 0;
node_del.capture = 1;
node_del.erase_color = [0,0,0,0];
node_del.dim = [1920, 1080];
node_del.type = "float32";
fxobs.push(node_del);

var shader_vor = new JitterObject("jit.gl.shader", node_vor.name);
shader_vor.file = "jit.fx.ge.pattern.voronoi.jxs";

var shader_del = new JitterObject("jit.gl.shader", drawto);
shader_del.file = "jit.fx.ge.pattern.delaunay.jxs";

var uvMat_vor = new JitterMatrix(3, "float32", 100, 100);
uvMat_vor.exprfill(0, "norm[0]");
uvMat_vor.exprfill(1, "norm[1]");

var uvMat_del = new JitterMatrix(3, "float32", node_del.dim);
uvMat_del.exprfill(0, "norm[0]");
uvMat_del.exprfill(1, "norm[1]");

var mesh = new JitterObject("jit.gl.mesh", node_vor.name);
mesh.draw_mode = "points";
mesh.blend_enable = 0;
mesh.depth_enable = 1;
mesh.texture = inTex.name;
mesh.shader = shader_vor.name;
mesh.jit_matrix(uvMat_vor.name);

var mesh_del = new JitterObject("jit.gl.mesh", node_del.name);
mesh_del.draw_mode = "points";
mesh_del.blend_enable = 0;
mesh_del.depth_enable = 1;
mesh_del.texture = node_vor.out_name;
mesh_del.shader = shader_del.name;
mesh_del.jit_matrix(uvMat_del.name);

var slab_combine = new JitterObject("jit.gl.slab", drawto);
slab_combine.file = "jit.fx.ge.pattern.combine.jxs";
slab_combine.inputs = 2;
slab_combine.type = "float32";
fxobs.push(slab_combine);

var slab_resize = new JitterObject("jit.gl.slab", drawto);
fxobs.push(slab_resize);

var amt = 0.5;
declareattribute("amt", null, "setamt", 0);
function setamt(v){ 
	amt = Math.max(0.0, Math.min(1.0, v));	
	shader_vor.param("threshold", 1 - amt);
}

var radius = 0.3;
declareattribute("radius", null, "setradius", 0);
function setradius(v){ 
	radius = Math.min(2.8284271247, v); //limit < 2*sqrt(2)
	shader_vor.param("radius", radius);
}

var randomness = 0.01;
declareattribute("randomness", null, "setrandomness", 0);
function setrandomness(v){ 
	randomness = v; 
	shader_vor.param("randomness", randomness);
}

var num_edges = 25;
declareattribute("num_edges", null, "setnum_edges", 0);
function setnum_edges(v){ 
	num_edges = Math.max(3, v);
	shader_vor.param("num_edges", num_edges);
}

var line_width = 1.0;
declareattribute("line_width", null, "setline_width", 0);
function setline_width(v){ 
	line_width = Math.max(0.0, v);	
	salb_resolve.param("line_width", line_width);
	shader_del.param("line_width", line_width*2);
}
setline_width(line_width);

var start_angle = 0.0;
declareattribute("start_angle", null, "setstart_angle", 0);
function setstart_angle(v){ 
	start_angle = v;
	shader_vor.param("start_angle", start_angle);
}

var complete = 1.0;
declareattribute("complete", null, "setcomplete", 0);
function setcomplete(v){ 
	complete = Math.max(0, Math.min(1,v));
	shader_vor.param("complete", complete);
}

var draw_mode = 0.0;
declareattribute("draw_mode", null, "setdraw_mode", 0);
function setdraw_mode(v){ 
	draw_mode = Math.max(0, Math.min(3, v));
}

var line_growth = 0.0;
declareattribute("line_growth", null, "setline_growth", 0);
function setline_growth(v){ 
	line_growth = Math.min(3, v);
	salb_resolve.param("line_growth", line_growth);
}

var line_fade = 1.0;
declareattribute("line_fade", null, "setline_fade", 0);
function setline_fade(v){ 
	line_fade = v;
	salb_resolve.param("line_fade", line_fade);
	shader_del.param("line_fade", line_fade);
}

var indimscale = [1, 1];
declareattribute("indimscale", null, "setindimscale", 0);
function setindimscale(){ 
	indimscale = [ arguments[0], arguments[1] ];
	slab_resize.dimscale = indimscale;
}

var outdim = [1920, 1080];
declareattribute("outdim", null, "setoutdim", 0);
function setoutdim(){ 
	outdim = [ arguments[0], arguments[1] ];
	node_vor.dim = outdim;
	node_del.dim = outdim;
	shader_vor.param("outdim", outdim);
	uvMat_del.dim = outdim;
	uvMat_del.exprfill(0, "norm[0]");
	uvMat_del.exprfill(1, "norm[1]");
	mesh_del.jit_matrix(uvMat_del.name);
}

function update_dim(dim){
	if(uvMat_vor.dim[0] != dim[0] || uvMat_vor.dim[1] != dim[1]){
		uvMat_vor.dim = [ dim[0], dim[1] ];
		uvMat_vor.exprfill(0, "norm[0]");
		uvMat_vor.exprfill(1, "norm[1]");
		mesh.jit_matrix(uvMat_vor.name);
	}
}

function drawfx(inname){

	slab_resize.jit_gl_texture(inname);
	slab_resize.draw();

	inTex.jit_gl_texture(slab_resize.out_name);

	update_dim(inTex.dim);

	node_vor.draw();

	switch(draw_mode) {
	  case 0:
		salb_resolve.jit_gl_texture(node_vor.out_name);
		salb_resolve.draw();
		outlet(0, "jit_gl_texture", salb_resolve.out_name);	
	    break;
	  case 1:
		node_del.draw();
		outlet(0, "jit_gl_texture", node_del.out_name);	
	    break;
	  case 2:
	  	salb_resolve.jit_gl_texture(node_vor.out_name);
		salb_resolve.draw();
		node_del.draw();
		slab_combine.activeinput = 1;
		slab_combine.jit_gl_texture(node_del.out_name);
		slab_combine.activeinput = 0;
		slab_combine.jit_gl_texture(salb_resolve.out_name);
		slab_combine.draw();
		outlet(0, "jit_gl_texture", slab_combine.out_name);	
	    break;
	  case 3:
		outlet(0, "jit_gl_texture", node_vor.out_name);	
	    break;
	}

}