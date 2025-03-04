import * as THREE from "three";
import { FrictionSpec, SimObject } from "./SimObject";
import { Vec2, Box } from "planck-js";
import { IPyramidSpec } from "../specs/CoreSpecs";
import { Vector2d } from "../SimTypes";
import { FixtureDef } from "planck-js";
import { BodyDef } from "planck-js";
import { EntityCategory, EntityMask } from "./robot/RobotCollisionConstants";

const DEFAULT_PYRAMID_COLOR = 0x0000ff;

/**
 * Factory method for creating a SimBall
 * @param spec
 */
export function makeSimPyramid(spec: IPyramidSpec): SimPyramid {
  return new SimPyramid(spec);
}

export class SimPyramid extends SimObject {
  private bodySpecs: BodyDef;
  private fixtureSpecs: FixtureDef;

  constructor(spec: IPyramidSpec) {
    super("SimPyramid");

    const color = spec.baseColor ? spec.baseColor : DEFAULT_PYRAMID_COLOR;
    const initialPosition: Vector2d = { x: 0, y: 0 };

    const halfX = spec.baseDimensions.x / 2;
    const halfZ = spec.baseDimensions.y / 2;

    const pyramidGeom = new THREE.BufferGeometry();
    pyramidGeom.setFromPoints([
      new THREE.Vector3(-halfX, 0, -halfZ),
      new THREE.Vector3(-halfX, 0, halfZ),
      new THREE.Vector3(halfX, 0, halfZ),
      new THREE.Vector3(halfX, 0, -halfZ),
      new THREE.Vector3(0, spec.height, 0),
    ]);
    pyramidGeom.setIndex([
      0,
      2,
      1,
      0,
      3,
      2,
      1,
      4,
      0,
      2,
      4,
      1,
      3,
      4,
      2,
      0,
      4,
      3,
    ]);
    pyramidGeom.computeVertexNormals();

    const pyramidMaterial = new THREE.MeshStandardMaterial({ color });
    const pyramidMesh = new THREE.Mesh(pyramidGeom, pyramidMaterial);

    if (spec.initialPosition) {
      initialPosition.x = spec.initialPosition.x;
      initialPosition.y = spec.initialPosition.y;
    }

    // Set initial starting positions
    //pyramidMesh.position.y = spec.height / 2; // Move up to sit on plane
    pyramidMesh.position.x = initialPosition.x;
    pyramidMesh.position.z = initialPosition.y;

    this._mesh = pyramidMesh;

    // Set up the physics body
    // NOTE: We will need to set sane defaults for physics properties in the event
    // that they are not provided by the spec
    this.bodySpecs = {
      type: spec.isStatic ? "static" : "dynamic",
      position: new Vec2(initialPosition.x, initialPosition.y),
      angle: 0,
      linearDamping: 0.5,
      bullet: true,
      angularDamping: 0.3,
    };

    this.fixtureSpecs = {
      shape: new Box(spec.baseDimensions.x / 2, spec.baseDimensions.y / 2),
      density: 1,
      isSensor: false,
      friction: 1,
      restitution: 0,
      filterCategoryBits: EntityCategory.OBJECTS,
      filterMaskBits: EntityMask.OBJECTS,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(ms: number): void {
    const bodyCenter = this._body.getWorldCenter();
    this._mesh.position.x = bodyCenter.x;
    this._mesh.position.z = bodyCenter.y;

    this._mesh.rotation.y = -this._body.getAngle();
  }

  setBaseColor(color: number): void {
    (<THREE.MeshStandardMaterial>this._mesh.material).color.set(color);
  }

  getBodySpecs(): BodyDef {
    return this.bodySpecs;
  }

  getFixtureDef(): FixtureDef {
    return this.fixtureSpecs;
  }

  getFriction(): FrictionSpec | null {
    return {
      maxForce: 0.1,
      maxTorque: 0.001,
    };
  }
}
