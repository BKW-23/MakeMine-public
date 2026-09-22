import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";

export default function ModelPreview({
  src,
  alt,
  layers = [],
  selectedId,
  onSelectLayer,
  onMoveLayer,
  onResetView,
  text,
  includeMessage,
  message,
  textColor,
  textSurface,
  textScale = 1,
  textRotation = 0,
  textSelected,
  onSelectText,
  onMoveText,
}) {
  const containerRef = useRef(null);
  const [showHint, setShowHint] = useState(false);
  const layersRef = useRef(layers);
  const selectedIdRef = useRef(selectedId);
  const onSelectLayerRef = useRef(onSelectLayer);
  const onMoveLayerRef = useRef(onMoveLayer);
  const onSelectTextRef = useRef(onSelectText);
  const onMoveTextRef = useRef(onMoveText);
  const textRef = useRef({ text, includeMessage, message, textColor, textSurface, textScale, textRotation, textSelected });

  layersRef.current = layers;
  selectedIdRef.current = selectedId;
  onSelectLayerRef.current = onSelectLayer;
  onMoveLayerRef.current = onMoveLayer;
  onSelectTextRef.current = onSelectText;
  onMoveTextRef.current = onMoveText;
  textRef.current = { text, includeMessage, message, textColor, textSurface, textScale, textRotation, textSelected };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    let defaultViewDistance = 3.2;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    camera.up.set(-1, 0, 0); // Giữ nguyên hướng nhìn từ trên xuống của bạn

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff4fb, 0x69516b, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffb6dc, 1.5);
    fillLight.position.set(-3, 1, 2);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);
    renderer.domElement.style.touchAction = "none";

    let model;
    let modelSize = new THREE.Vector3(1, 1, 1);
    let defaultSurface = null;
    let renderedLayersKey = "";
    let textTexture;
    const stickerGroup = new THREE.Group();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const modelMeshes = [];
    const activePointers = new Set();
    let draggingLayer = null;

    // --- HÀM CANH TÂM VÀ FIT CAMERA DÙNG CHUNG CHO PC VÀ MOBILE ---
    const fitCameraToView = () => {
      if (!model) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      const aspect = width / height;

      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      // Tính Bounding Sphere chuẩn sau khi model đã đưa về (0,0,0)
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const radius = sphere.radius || 1;

      // Tính khoảng cách cần thiết cho cả 2 chiều (Dọc & Ngang) để không bao giờ bị cắt viền
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const distVertical = radius / Math.sin(vFov / 2);

      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const distHorizontal = radius / Math.sin(hFov / 2);

      // Lấy khoảng cách lớn hơn + 30% margin an toàn
      defaultViewDistance = Math.max(distVertical, distHorizontal) * 1.3;

      // Đặt camera luôn nhìn thẳng vào gốc (0,0,0)
      camera.position.set(0, defaultViewDistance, 0.01);
      camera.lookAt(0, 0, 0);

      controls.target.set(0, 0, 0);
      controls.minDistance = defaultViewDistance * 0.4;
      controls.maxDistance = defaultViewDistance * 2.5;
      controls.update();
    };

    const resetView = () => {
      camera.up.set(-1, 0, 0);
      fitCameraToView();
    };
    onResetView?.(() => resetView);

    let resizeFrame = 0;
    const resize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        fitCameraToView();
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    // --- LOAD MODEL ---
    new GLTFLoader().load(
      src,
      (gltf) => {
        model = gltf.scene;
        modelMeshes.length = 0;

        model.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => {
                material.side = THREE.FrontSide;
                material.depthWrite = true;
              });
            } else if (object.material) {
              object.material.side = THREE.FrontSide;
              object.material.depthWrite = true;
            }
            modelMeshes.push(object);
          }
        });

        // 1. Tính toán kích thước ban đầu
        let box = new THREE.Box3().setFromObject(model);
        let center = box.getCenter(new THREE.Vector3());
        let size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z) || 1;

        // 2. Scale chuẩn hóa về kích thước tương đương nhau
        model.scale.setScalar(2.1 / maxSize);

        // 3. ĐƯA CHÍNH XÁC TÂM MODEL VỀ (0,0,0) THỰC TẾ
        model.updateMatrixWorld(true);
        box.setFromObject(model);
        center = box.getCenter(new THREE.Vector3());
        model.position.sub(center); // Dịch chuyển model sao cho tâm BoundingBox nằm đúng tại 0,0,0

        modelSize = box.getSize(new THREE.Vector3());
        model.add(stickerGroup);
        scene.add(model);

        // Fit camera theo kích thước màn hình hiện tại
        fitCameraToView();

        // Tìm điểm mặt định để dán sticker ban đầu
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const centerHit = raycaster.intersectObjects(modelMeshes, false)[0];
        if (centerHit?.face) {
          const worldNormal = centerHit.face.normal.clone().transformDirection(centerHit.object.matrixWorld);
          defaultSurface = {
            position: model.worldToLocal(centerHit.point.clone()).toArray(),
            normal: worldNormal.clone().transformDirection(model.matrixWorld.clone().invert()).normalize().toArray(),
          };
        }
        renderedLayersKey = "";
      },
      undefined,
      (error) => console.error("Unable to load product model.", error)
    );

    // --- RENDER LOOP & STICKERS ---
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();

      const currentLayers = layersRef.current;
      const currentText = textRef.current;
      const layersKey = `${selectedIdRef.current}|${currentLayers
        .map(
          (layer) =>
            `${layer.id}:${layer.x}:${layer.y}:${layer.scale}:${layer.opacity}:${layer.rotation || 0}:${JSON.stringify(
              layer.surface || null
            )}`
        )
        .join("|")}|text:${currentText.text}|message:${currentText.includeMessage ? currentText.message : ""}|color:${currentText.textColor}|surface:${JSON.stringify(currentText.textSurface || null)}|scale:${currentText.textScale}|rotation:${currentText.textRotation}|selectedText:${currentText.textSelected}`;

      if (layersKey !== renderedLayersKey) {
        renderedLayersKey = layersKey;
        while (stickerGroup.children.length) {
          const child = stickerGroup.children.pop();
          child.geometry?.dispose();
          child.material?.map?.dispose();
          child.material?.dispose();
        }

        currentLayers.forEach((layer) => {
          if (!modelMeshes[0]) return;
          const image = layer.sticker.icon || layer.sticker.image;
          const surface = layer.surface || defaultSurface;
          const position = surface?.position
            ? new THREE.Vector3(...surface.position)
            : new THREE.Vector3(0, 0, modelSize.z * 0.5);
          const normal = surface?.normal
            ? new THREE.Vector3(...surface.normal)
            : new THREE.Vector3(0, 0, 1);
          const orientationQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            normal
          );
          orientationQuaternion.multiply(
            new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(0, 0, 1),
              Math.PI / 2 + THREE.MathUtils.degToRad(layer.rotation || 0)
            )
          );
          const orientation = new THREE.Euler().setFromQuaternion(orientationQuaternion);

          new THREE.TextureLoader().load(image, (texture) => {
            const aspect = texture.image.width / texture.image.height || 1;
            const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              depthTest: true,
              polygonOffset: true,
              polygonOffsetFactor: -4,
              side: THREE.FrontSide,
              opacity: layer.opacity / 100,
            });

            const decal = new DecalGeometry(
              modelMeshes[0],
              position,
              orientation,
              new THREE.Vector3(
                modelSize.x * 0.16 * layer.scale * aspect,
                modelSize.x * 0.16 * layer.scale,
                Math.max(modelSize.z * 0.04, 0.001)
              )
            );
            const mesh = new THREE.Mesh(decal, material);
            mesh.userData.layerId = layer.id;
            mesh.renderOrder = 10;
            stickerGroup.add(mesh);

            const pickMesh = new THREE.Mesh(
              new THREE.PlaneGeometry(
                modelSize.x * 0.16 * layer.scale * aspect,
                modelSize.x * 0.16 * layer.scale
              ),
              new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, side: THREE.DoubleSide })
            );
            pickMesh.position.copy(position);
            pickMesh.rotation.copy(orientation);
            pickMesh.userData.layerId = layer.id;
            pickMesh.userData.isStickerPick = true;
            stickerGroup.add(pickMesh);

            if (layer.id === selectedIdRef.current) {
              const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x3b82f6, depthTest: false });
              const outline = new THREE.LineSegments(
                new THREE.EdgesGeometry(
                  new THREE.PlaneGeometry(
                    modelSize.x * 0.16 * layer.scale * aspect,
                    modelSize.x * 0.16 * layer.scale
                  )
                ),
                outlineMaterial
              );
              outline.position.copy(position);
              outline.rotation.copy(orientation);
              outline.renderOrder = 20;
              outline.userData.layerId = layer.id;
              stickerGroup.add(outline);
            }
          });
        });

        if (currentText.text) {
          const canvas = document.createElement("canvas");
          let context = canvas.getContext("2d");
          const hasMessage = currentText.includeMessage && currentText.message;
          const textFont = "bold 112px sans-serif";
          const messageFont = "italic 42px sans-serif";
          const nameLines = currentText.text.split(/\r?\n/);
          const messageLines = hasMessage ? currentText.message.split(/\r?\n/) : [];
          context.font = textFont;
          const nameWidth = Math.max(...nameLines.map((line) => context.measureText(line || " ").width));
          context.font = messageFont;
          const messageWidth = hasMessage
            ? Math.max(...messageLines.map((line) => context.measureText(`“${line}”`).width))
            : 0;
          const nameLineHeight = 130;
          const messageLineHeight = 58;
          const nameHeight = nameLines.length * nameLineHeight;
          const messageHeight = messageLines.length * messageLineHeight;
          canvas.width = Math.ceil(Math.max(nameWidth, messageWidth) + 96);
          canvas.height = nameHeight + (hasMessage ? messageHeight + 42 : 0);
          context = canvas.getContext("2d");
          context.fillStyle = currentText.textColor || "#000000";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.font = textFont;
          nameLines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, nameLineHeight / 2 + index * nameLineHeight);
          });
          if (hasMessage) {
            context.font = messageFont;
            messageLines.forEach((line, index) => {
              context.fillText(`“${line}”`, canvas.width / 2, nameHeight + 21 + index * messageLineHeight);
            });
          }
          textTexture = new THREE.CanvasTexture(canvas);
          textTexture.colorSpace = THREE.SRGBColorSpace;
          const surface = currentText.textSurface || defaultSurface;
          if (surface) {
            const position = new THREE.Vector3(...surface.position);
            const normal = new THREE.Vector3(...surface.normal);
            const orientationQuaternion = new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 0, 1),
              normal
            );
            orientationQuaternion.multiply(
              new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 0, 1),
                Math.PI / 2 + THREE.MathUtils.degToRad(currentText.textRotation || 0)
              )
            );
            const orientation = new THREE.Euler().setFromQuaternion(orientationQuaternion);
            const textHeight = modelSize.x * 0.22 * (currentText.textScale || 1);
            const textWidth = textHeight * (canvas.width / canvas.height);
            const material = new THREE.MeshBasicMaterial({
              map: textTexture,
              transparent: true,
              depthTest: true,
              polygonOffset: true,
              polygonOffsetFactor: -4,
            });
            const textMesh = new THREE.Mesh(
              new DecalGeometry(modelMeshes[0], position, orientation, new THREE.Vector3(textWidth, textHeight, Math.max(modelSize.z * 0.04, 0.001))),
              material
            );
            textMesh.renderOrder = 12;
            stickerGroup.add(textMesh);

            const pickMesh = new THREE.Mesh(
              new THREE.PlaneGeometry(textWidth, textHeight),
              new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, side: THREE.DoubleSide })
            );
            pickMesh.position.copy(position);
            pickMesh.rotation.copy(orientation);
            pickMesh.userData.isTextPickArea = true;
            stickerGroup.add(pickMesh);
            if (currentText.textSelected) {
              const outline = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.PlaneGeometry(textWidth, textHeight)),
                new THREE.LineBasicMaterial({ color: 0x3b82f6, depthTest: false })
              );
              outline.position.copy(position);
              outline.rotation.copy(orientation);
              outline.renderOrder = 20;
              stickerGroup.add(outline);
            }
          }
        }
      }
      renderer.render(scene, camera);
    };

    // --- SỰ KIỆN CHUỘT / TẠO STICKER DRAG ---
    const updatePointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    };

    const getFrontModelHit = () => {
      const intersections = raycaster.intersectObjects(modelMeshes, false);
      return intersections.find((intersection) => {
        if (!intersection.face) return true;
        const worldNormal = intersection.face.normal
          .clone()
          .transformDirection(intersection.object.matrixWorld);
        return worldNormal.dot(raycaster.ray.direction) < 0;
      });
    };

    const onPointerDown = (event) => {
      event.stopPropagation();
      if (event.pointerType === "touch") {
        activePointers.add(event.pointerId);
        if (activePointers.size > 1) {
          draggingLayer = null;
          controls.enabled = true;
          return;
        }
      }
      updatePointer(event);
      const decals = raycaster
        .intersectObjects(stickerGroup.children, false)
        .filter((intersection) => intersection.object.userData.isStickerPick);
      const textHit = raycaster.intersectObjects(stickerGroup.children, false)
        .find((intersection) => intersection.object.userData.isTextPickArea);
      if (textHit) {
        onSelectTextRef.current?.(true);
        controls.enabled = false;
        draggingLayer = "text";
        return;
      }
      onSelectTextRef.current?.(false);
      const hitDecal = decals[0]?.object;
      if (hitDecal?.userData.layerId) {
        draggingLayer = hitDecal.userData.layerId;
        onSelectLayerRef.current?.(draggingLayer);
        controls.enabled = false;
        return;
      }
      const hitModel = getFrontModelHit();
      if (!hitModel) {
        onSelectLayerRef.current?.(null);
        return;
      }
      onSelectLayerRef.current?.(null);
    };

    const onPointerMove = (event) => {
      if (!draggingLayer) return;
      updatePointer(event);
      const hit = getFrontModelHit();
      if (!hit) return;
      const position = model.worldToLocal(hit.point.clone());
      const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      const normal = worldNormal
        .clone()
        .transformDirection(model.matrixWorld.clone().invert())
        .normalize();
      if (draggingLayer === "text") {
        onMoveTextRef.current?.({ position: position.toArray(), normal: normal.toArray() });
      } else {
        onMoveLayerRef.current?.(draggingLayer, { position: position.toArray(), normal: normal.toArray() });
      }
    };

    const onPointerUp = () => {
      draggingLayer = null;
      controls.enabled = true;
    };

    const onPointerEnd = (event) => {
      if (event.pointerType === "touch") activePointers.delete(event.pointerId);
      onPointerUp();
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerEnd);
    renderer.domElement.addEventListener("pointercancel", onPointerEnd);
    renderer.domElement.addEventListener("lostpointercapture", onPointerEnd);
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerEnd);
      renderer.domElement.removeEventListener("pointercancel", onPointerEnd);
      renderer.domElement.removeEventListener("lostpointercapture", onPointerEnd);
      onResetView?.(null);
      if (model) {
        model.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
            else object.material.dispose();
          }
          textTexture?.dispose();
        });
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src]);

  return (
    <div className="absolute inset-0 h-full w-full select-none">
      <div
        ref={containerRef}
        role="img"
        aria-label={alt}
        className="absolute inset-0 h-full w-full"
        onPointerDown={() => setShowHint(false)}
      />
      {showHint && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-slate-900/75 px-3 py-1.5 text-[11px] text-slate-200 shadow-md backdrop-blur-md transition-opacity sm:text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            <span className="sm:hidden">1 ngón xoay · 2 ngón kéo/zoom</span>
            <span className="hidden sm:inline">Giữ chuột trái để xoay · chuột phải để di chuyển</span>
          </div>
        </div>
      )}
    </div>
  );
}