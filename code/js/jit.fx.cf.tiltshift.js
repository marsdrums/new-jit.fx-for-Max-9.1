inlets = 1;
outlettypes = ["jit_gl_texture"];

include("jit.fx.include.nooutput.js");

var slab_mask = new JitterObject("jit.gl.slab", drawto);
slab_mask.file = "jit.fx.cf.tiltshift.mask.jxs";
slab_mask.inputs = 1;
slab_mask.rectangle = 0;
fxobs.push(slab_mask);

slab.file = "jit.fx.cf.tiltshift.v.jxs";
slab.inputs = 2;
let slab_ver = slab;
fxobs.push(slab_ver);

var slab_hor = new JitterObject("jit.gl.slab", drawto);
slab_hor.file = "jit.fx.cf.tiltshift.h.jxs";
slab_hor.inputs = 2;
fxobs.push(slab_hor);

var maskTex = new JitterObject("jit_gl_texture", drawto);
maskTex.adapt = 1;
fxobs.push(maskTex);

var fdbkTex = new JitterObject("jit_gl_texture", drawto);
fdbkTex.adapt = 1;
fxobs.push(fdbkTex);

var blur_amount = 1.0;
declareattribute("blur_amount", null, "setblur_amount", 0);
function setblur_amount(v){ 
	blur_amount = v;	
}

var slope = 1.0;
declareattribute("slope", null, "setslope", 0);
function setslope(v){ 
	slope = v;	
	slab_mask.param("slope", slope);
}

var angle = 0.0;
declareattribute("angle", null, "setangle", 0);
function setangle(v){ 
	angle = v;	
	slab_mask.param("cosangle", Math.cos(angle));
	slab_mask.param("sinangle", Math.sin(angle));
}

var mode = 0;
declareattribute("mode", null, "setmode", 0);
function setmode(v){ 
	mode = Math.max(0, Math.min(1, v));	
	slab_mask.param("mode", mode);
}

var center = [0,0];
declareattribute("center", null, "setcenter", 0);
function setcenter(){ 
	center = [ arguments[0], arguments[1] ];	
	slab_mask.param("center", center);
}

var tile = new Array(2);
var amt;

function jit_gl_texture(inname){

	if(bypass == 1){
		outlet(0, "jit_gl_texture", inname);
	} else {

		fdbkTex.jit_gl_texture(inname);
		slab_mask.jit_gl_texture(fdbkTex.name);
		slab_mask.draw();
		slab_hor.activeinput = 1;
		slab_ver.activeinput = 1;
		slab_hor.jit_gl_texture(slab_mask.out_name);
		slab_ver.jit_gl_texture(slab_mask.out_name);
		slab_hor.activeinput = 0;
		slab_ver.activeinput = 0;

		amt = blur_amount; 

		for(var i = 0; i < 5; i++){

			tile[0] = 128 * (i % 8);
			tile[1] = 128 * Math.floor(i / 8);
			slab_ver.param("tile", tile);
			slab_hor.param("tile", tile);
			slab_ver.param("blur_amount", amt);
			slab_hor.param("blur_amount", amt);

			slab_ver.jit_gl_texture(fdbkTex.name);
			slab_ver.draw();

			slab_hor.jit_gl_texture(slab_ver.out_name);
			slab_hor.draw();

			fdbkTex.jit_gl_texture(slab_hor.out_name);	
			amt *= 1.3333333333;	
		}	
		outlet(0, "jit_gl_texture", fdbkTex.name);
		//outlet(0, "jit_gl_texture", slab_mask.out_name);
	}
}