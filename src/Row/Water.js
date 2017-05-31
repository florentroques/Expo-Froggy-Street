import Expo from 'expo'
import React, {Component} from 'react';

import {TweenMax, Power2, TimelineLite} from "gsap";
import * as THREE from 'three';

import {groundLevel} from '../Game';
import {modelLoader} from '../../main';
import Foam from '../Particles/Foam'
export default class Road extends THREE.Object3D {
  active = false;
  entities = [];

  getWidth = (mesh) => {
    let box3 = new THREE.Box3();
    box3.setFromObject(mesh);
    // console.log( box.min, box.max, box.size() );
    return Math.round(box3.max.x - box3.min.x);
  }

  generate = () => {
    this.entities.map(val => {
      this.floor.remove(val);
      val = null;
    })
    this.entities = [];

    // Speeds: .01 through .08
    // Number of cars: 1 through 3
    let speed = (Math.floor(Math.random() * (4)) + 2) / 80;
    let numItems = Math.floor(Math.random() * 2) + 1;
    let xDir = 1;

    if (Math.random() > .5) {
      xDir = -1;
    }

    xPos = -6 * xDir;

    for (let x = 0; x < numItems; x++) {

      if (this.entities.length - 1 < x) {

        let mesh = modelLoader._log.getRandom();
        const width = this.getWidth(mesh);

        this.entities.push({mesh: mesh, dir: xDir, width, collisionBox: (this.heroWidth / 2 + width / 2 - 0.1) });

        this.floor.add(mesh)
      }

      this.entities[x].mesh.position.set(xPos, -0.1, 0);
      this.entities[x].speed = speed * xDir;
      // this.entities[x].mesh.rotation.y = (Math.PI / 2) * xDir;

      xPos -= ((Math.random() * 3) + 5) * xDir;
    }
  }

  bounce = ({entity, player}) => {
      let timing = 0.2;
      TweenMax.to(entity.mesh.position, timing * 0.9, {
        y: -0.3,
      });

      TweenMax.to(entity.mesh.position, timing, {
        y: -0.1,
        delay: timing
      });

      TweenMax.to(player.position, timing * 0.9, {
        y: groundLevel + -0.1,
      });

      TweenMax.to(player.position, timing, {
        y: groundLevel,
        delay: timing
      });


  }

  constructor(heroWidth, onCollide) {
    super();
    this.heroWidth = heroWidth;
    this.onCollide = onCollide;
    const {_river} = modelLoader;

    this.floor = _river.getNode();
    this.add(this.floor);


    let foam = new Foam(THREE, 1);
    foam.mesh.position.set(4.5,0.2,-0.5);
    foam.mesh.visible = true;
    foam.run();
    this.floor.add(foam.mesh);


    this.generate();
  }

  update = (dt, player) => {
    if (!this.active) {
      return;
    }
    this.entities.map(entity => this.move({dt, player, entity}) )

    if (!player.moving && !player.ridingOn) {

        this.entities.map(entity => this.shouldCheckCollision({dt, player, entity}) )
        this.shouldCheckHazardCollision({player});

    }

  }

  move = ({dt, player, entity}) => {
    const {position, ridingOn, moving} = player;
      const offset = 11;

        entity.mesh.position.x += entity.speed;

        if (entity.mesh.position.x > offset && entity.speed > 0) {
          entity.mesh.position.x = -offset;
        } else if (entity.mesh.position.x < -offset && entity.speed < 0) {
          entity.mesh.position.x = offset;
        } else {


        }

  }

  sineCount = 0;
  sineInc = Math.PI / 50;


  shouldCheckHazardCollision = ({player}) => {
    if (Math.round(player.position.z) == this.position.z && !player.moving) {
      if (!player.ridingOn) {
        if (player.isAlive) {
          this.onCollide(this.floor, 'water');
        } else {
          let y = Math.sin(this.sineCount) * .08 - .2;
          this.sineCount += this.sineInc;
          player.position.y = y;
          player.rotation.y += 0.01;

          player.position.x += this.entities[0].speed / 3;
        }
      }
    }
  }

  shouldCheckCollision = ({player, entity}) => {
    if (Math.round(player.position.z) == this.position.z && player.isAlive) {

      const {mesh, collisionBox} = entity;

      if (player.position.x < mesh.position.x + collisionBox && player.position.x > mesh.position.x - collisionBox) {
        player.ridingOn = entity;
        player.ridingOnOffset = (player.position.x - entity.mesh.position.x);
        this.bounce({entity, player});
        // if (player.moving && Math.abs(player.position.z - Math.round(player.position.z)) > 0.1) {
        //
        //   player.ridingOn = entity;
        //
        //   // const forward = player.position.z - Math.round(player.position.z) > 0;
        //   // player.position.z = this.position.z + (forward ? 0.52 : -0.52);
        //   //
        //   // TweenMax.to(player.scale, 0.3, {
        //   //   y: 1.5,
        //   //   z: 0.2,
        //   // });
        //   // TweenMax.to(player.rotation, 0.3, {
        //   //   z: (Math.random() * Math.PI) - Math.PI/2,
        //   // });
        //
        // } else {
        //
        //   player.position.y = groundLevel;
        //   TweenMax.to(player.scale, 0.3, {
        //     y: 0.2,
        //     x: 1.5,
        //   });
        //   TweenMax.to(player.rotation, 0.3, {
        //     y: (Math.random() * Math.PI) - Math.PI/2,
        //   });
        // }
        // this.onCollide(entity);
        return;
      }
    }
  }





}