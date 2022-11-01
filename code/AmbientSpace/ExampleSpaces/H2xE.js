import {
    Matrix3,
    SphereBufferGeometry,
    BoxBufferGeometry,
    Vector2,
    Vector3,
    Vector4, CylinderBufferGeometry
} from "../../../3party/three/build/three.module.js";

import {
    randomVec3Ball,
    randomVec3Sphere
} from "../../utils/random.js";

import {State} from "../../Computation/State.js";

import { Geometry } from "../Components/Geometry.js";
import {Model} from "../Components/Model.js";
import {Obstacle} from "../Components/Obstacle.js";

import {AmbientSpace} from "../AmbientSpace.js";




//hyperboloid in R3
function minkowskiDot(u,v){
    return u.z*v.z - ( u.x*v.x + u.y*v.y );
}

//distance on hyperboloid:
//here u and V are 3D vectors
function hyperboloidDistance(u,v){
    return Math.acosh(Math.abs(minkowskiDot(u,v)));
}




//map from H2xE to the hyperboloid in R3
//point pos = Vec3(x,y,z) with xy in Poincare Disk, z on real line
function toHyperboloid(pos){

    let diskPt = new Vector2(pos.x,pos.y);
    let len2 = diskPt.lengthSq();
    let w = 1 + len2;
    let p = new Vector3(2.*diskPt.x,2.*diskPt.y, w).divideScalar(1-len2);

    return p;
}






// -------------------------------------------------------------
//some geometry stuff:
// -------------------------------------------------------------


//the hyperbolic direction is the Poincare Disk: this is conformal to the Euclidean Metric
function conformalFactor(pos){

    let diskPt = new Vector2(pos.x,pos.y);
    let r2 = diskPt.lengthSq();
    let diff = 1-r2;
    let diff2 = diff*diff;

    return  4./(diff2);
}



let metricTensor = function(pos){

    //just multiply the identity by the conformal factor on the H2 direction
    //leave the R direction just "1"
    let scale = conformalFactor(pos);
    return new Matrix3().set(
        scale,0,0,
        0, scale,0,
        0,0,1
    );
}


//measure distance between two Vec3s in the model
let distance = function(pos1,pos2){

    let u = toHyperboloid(pos1);
    let v = toHyperboloid(pos2);

    let a = pos1.z;
    let b = pos2.z;

    //get hyperboloid Distance:
    let hypDist = hyperboloidDistance(u,v);

    //get euclidean distance
    let eucDist = Math.abs(b-a);

    //apply Pythagoras
    let dist2 = hypDist*hypDist + eucDist*eucDist;

    return Math.sqrt(dist2);
}



let christoffel = function(state){

    let pos = state.pos.clone();
    let x = pos.x;
    let y = pos.y;

    let vel = state.vel.clone();
    let xP = vel.x;
    let yP = vel.y;
    let zP = vel.z;

    let xP2 = xP*xP;
    let yP2 = yP*yP;

    let denom = x*x + y*y -1;

    let xPP = 2*x * ( xP2 - yP2 ) + 4 * xP * ( y*yP );
    let yPP = 2*y * ( yP2 - xP2 ) + 4 * yP * ( x*xP );
    let zPP = 0;

    let acc =  new Vector3(xPP,yPP,zPP).divideScalar(denom);

    return acc;
}


let space = new Geometry(
    distance,
    metricTensor,
    christoffel);





// -------------------------------------------------------------
//model of Euclidean space : do nothing
// -------------------------------------------------------------

//there is no model for this space: its a metric directly on R3!
//though, its all drawn inside of a cylinder with xy in a disk, z in R
// so let's re-arrange the coordinates so the cylinder axis is drawn vertically
// also, let's scale it up

let zoom = 6.;

let coordsToModel= function(coords){
    return new Vector3(coords.x,coords.z,coords.y).multiplyScalar(zoom);
}

//the scaling factor is computed from the metric tensor:
//this should be INHOMOGENEOUS: should turn spheres into ellipses and stuff!
//need to build a better way to work with geometries to do that if we wanted...
let modelScaling = function(modelPos){
    //unscale position back to true coordinate position:
    let coordPos = new Vector3(modelPos.x,modelPos.z,modelPos.y).divideScalar(zoom);
    let scale = conformalFactor(coordPos);
    return zoom/Math.sqrt(scale);

}

let model = new Model(coordsToModel, modelScaling);




// -------------------------------------------------------------
//obstacles to contain balls in Euclidean Space
// -------------------------------------------------------------

//a cylinder of radius R, height H
let coordRad = 0.8;
let Rad = distance(new Vector3(0,0,0), new Vector3(coordRad,0,0));
let Height = 2.;

//average size of this domain
let size = (Rad+Height)/2.;

//the metric distance from the origin to a cylinder is the
//minimum of the distance to cylinder walls and tops
let distToCylinder = function(pos){

    let u = toHyperboloid(pos);
    let v = toHyperboloid(new Vector3(0,0,0));
    let z = pos.z;

    //get hyperboloid Distance:
    let hypDist = Rad - hyperboloidDistance(u,v);

    //get Euclidean Distance to top/Bottom:
    let eucDist = Height/2-Math.abs(z);

    return Math.min(hypDist,eucDist);
}


//this is not the right geometry for the sphere zone we are stuck inside of
//instead should take a cylinder?!
let cylGeom = new CylinderBufferGeometry(zoom*coordRad,zoom*coordRad,zoom*Height,32);
//cylGeom.position.set(0,-Height/2,0);


let generateState = function(){

    let pos = randomVec3Sphere(0.5*coordRad);
    let vel = randomVec3Ball(3).divideScalar(conformalFactor(pos));
    return new State(pos,vel);
}


let obstacle = new Obstacle(
    distToCylinder,
    cylGeom,
    size,
    generateState
);





//package stuff up for export
let h2xe = new AmbientSpace( space, model, obstacle);

export { h2xe };
