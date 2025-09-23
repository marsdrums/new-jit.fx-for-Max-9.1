inlets = 1;

include("jit.fx.include.js")

slab.file = "jit.fx.cf.kuwahara.jxs";
slab.inputs = 2;
slab.type = "float16";

let tensor_slab = new JitterObject("jit.gl.slab", drawto);
tensor_slab.file = "jit.fx.cf.kuwahara.tensor.jxs";
tensor_slab.inputs = 1;
tensor_slab.type = "float16";
fxobs.push(tensor_slab);

let filter_h_slab = new JitterObject("jit.gl.slab", drawto);
filter_h_slab.file = "jit.fx.cf.kuwahara.gaussian_h.jxs";
filter_h_slab.inputs = 1;
filter_h_slab.type = "float16";
fxobs.push(filter_h_slab);

let filter_v_slab = new JitterObject("jit.gl.slab", drawto);
filter_v_slab.file = "jit.fx.cf.kuwahara.gaussian_v.jxs";
filter_v_slab.inputs = 1;
filter_v_slab.type = "float16";
fxobs.push(filter_v_slab);

var sharpness = 10.0;
declareattribute("sharpness", {default: 10.0, type: "float32", setter: "setsharpness" });
function setsharpness(v){ 
	sharpness = v;
	slab.param("alpha", 1/Math.max(0.001, sharpness));
}

var hardness = 1.0;
declareattribute("hardness", {default: 1.0, type: "float32", setter: "sethardness" });
function sethardness(v){ 
	hardness = v;
	slab.param("hardness", hardness*100);
}

var kernel_size = 14;
declareattribute("kernel_size", {default: 14, type: "int", setter: "setkernel_size" });
function setkernel_size(v){ 
	kernel_size = v;
	slab.param("kernel_size", kernel_size);
}

var pre_blur = 4;
declareattribute("pre_blur", {default: 4, type: "int", setter: "setpre_blur" });
function setpre_blur(v){ 
	pre_blur = v;
	filter_h_slab.param("kernel_radius", pre_blur);
	filter_v_slab.param("kernel_radius", pre_blur);
}

fdbkTex.type = "float16";


function drawfx(inname){

	fdbkTex.jit_gl_texture(inname);

	tensor_slab.jit_gl_texture(fdbkTex.name);
	tensor_slab.draw();
	filter_h_slab.jit_gl_texture(tensor_slab.out_name);
	filter_h_slab.draw();
	filter_v_slab.jit_gl_texture(filter_h_slab.out_name);
	filter_v_slab.draw();
	slab.activeinput = 1;
	slab.jit_gl_texture(filter_v_slab.out_name);
	slab.activeinput = 0;
	slab.jit_gl_texture(fdbkTex.name);
	slab.draw();

	outlet(0, "jit_gl_texture", slab.out_name);
}