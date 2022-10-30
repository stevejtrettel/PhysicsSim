import {
    Matrix3,
    SphereBufferGeometry,
    BoxBufferGeometry,
    Vector3
} from "../../../3party/three/build/three.module.js";

import { Geometry } from "../Components/Geometry.js";
import {Model} from "../Components/Model.js";
import {Obstacle} from "../Components/Obstacle.js";

import {AmbientSpace} from "../AmbientSpace.js";




// -------------------------------------------------------------
//This is an INHOMOGENEOUS geometry on R3 that has an explicit distance function
//Found on https://mathoverflow.net/questions/37651/riemannian-surfaces-with-an-explicit-distance-function
// -------------------------------------------------------------






// -------------------------------------------------------------
//some geometry stuff:
// -------------------------------------------------------------


let metricTensor = function(pos){

    let x = pos.x;
    let y = pos.y;
    let conformalFactor = x*x + y*y + 2;

    return new Matrix3().identity().multiplyScalar(conformalFactor);
}


//an auxilary function to compute the distance:

function f(x){
    let sqrt2 = Math.sqrt(2);
    return Math.asinh(x/sqrt2) + x*Math.sqrt(x*x+2)/2;
}


let distance = function(p,q){

    let u = p.clone().sub(q).length();
    let v = p.clone().add(q).length();

    let avg = (u+v)/2;
    let diff = (u-v)/2;

    return f(avg)+f(diff);
}



let christoffel = function(state){
    return new Vector3(0,0,0);
}


let space = new Geometry(
    distance,
    metricTensor,
    christoffel);





// -------------------------------------------------------------
//model of Euclidean space : do nothing
// -------------------------------------------------------------

//there is no model for this space: its a metric directly on R3!
let coordsToModel= function(coords){
    return coords;
}

//the scaling factor is computed from the metric tensor:
//this metric tensor is conformal so its easy: sqrt(conformalCoef)

let modelScaling = function(pos){

    let x = pos.x;
    let y = pos.y;

    return Math.sqrt(x*x+y*y+2);
}

let model = new Model(coordsToModel, modelScaling);





// -------------------------------------------------------------
//obstacles to contain balls in Euclidean Space
// -------------------------------------------------------------

//a sphere

let distToSphere = function(pos){
    return 6.-pos.length();
}
let sphereGeom = new SphereBufferGeometry(6,64,32);

let obstacle = new Obstacle(
    distToSphere,
    sphereGeom
);





//package stuff up for export
let inhomogeneous = new AmbientSpace( space, model, obstacle);

export { inhomogeneous };
