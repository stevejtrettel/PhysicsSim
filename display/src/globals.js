
import { PMREMGenerator } from "../../3party/three/build/three.module.js";
import {createRenderer} from "../World/components/createRenderer.js";

const globalParams = { };

const renderer = createRenderer();

const pmremGen = new PMREMGenerator(renderer);
pmremGen.compileCubemapShader();




const globals = {
    renderer: renderer,
    pmremGen: pmremGen,
    color: 0x2f508a,
        //0x539165,
    params: globalParams,
};


export { globals };
