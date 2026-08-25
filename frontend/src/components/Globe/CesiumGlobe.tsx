import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useNavigation } from '../../state/NavigationContext';

export const CesiumGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  const {
    icebergs,
    selectedIceberg,
    setSelectedIceberg,
    trajectory,
    routes,
    selectedRoute,
    simulation,
    layers,
    environment,
  } = useNavigation();

  // 1. Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    // Use default Bing or Natural Earth imagery
    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      scene3DOnly: true,
      shadows: true,
    });

    // Darker space atmosphere
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#06090e');
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.brightnessShift = -0.2;
    }

    // Initial Camera position focused on Antarctic Peninsula & Weddell Sea
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-60.0, -64.5, 1200000.0), // Lon, Lat, Height (m)
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-75.0),
        roll: 0.0,
      },
    });

    // Handle entity click selection
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id;
        if (entity.properties && entity.properties.icebergData) {
          const ibData = entity.properties.icebergData.getValue();
          setSelectedIceberg(ibData);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, [setSelectedIceberg]);

  // 2. Render Research Stations
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !environment) return;

    // Remove previous station entities
    const toRemove = viewer.entities.values.filter((e) => e.name === 'station_entity');
    toRemove.forEach((e) => viewer.entities.remove(e));

    if (!layers.stations) return;

    environment.stations.forEach((st) => {
      viewer.entities.add({
        name: 'station_entity',
        position: Cesium.Cartesian3.fromDegrees(st.lon, st.lat, 20.0),
        billboard: {
          image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%2338bdf8"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10" stroke="%2338bdf8" stroke-width="2" fill="none"/></svg>',
          width: 20,
          height: 20,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
        label: {
          text: st.name,
          font: '11px JetBrains Mono, monospace',
          fillColor: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -22),
        },
      });
    });
  }, [environment, layers.stations]);

  // 3. Render Icebergs (3D Objects & Glyphs)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const toRemove = viewer.entities.values.filter((e) => e.name === 'iceberg_entity');
    toRemove.forEach((e) => viewer.entities.remove(e));

    if (!layers.icebergs) return;

    icebergs.forEach((ib) => {
      const isSelected = selectedIceberg?.id === ib.id;
      const riskColor =
        ib.risk_level === 'CRITICAL'
          ? Cesium.Color.RED
          : ib.risk_level === 'HIGH'
          ? Cesium.Color.ORANGE
          : ib.risk_level === 'MEDIUM'
          ? Cesium.Color.YELLOW
          : Cesium.Color.CYAN;

      viewer.entities.add({
        name: 'iceberg_entity',
        position: Cesium.Cartesian3.fromDegrees(ib.lon, ib.lat, 0.0),
        properties: {
          icebergData: ib,
        },
        box: {
          dimensions: new Cesium.Cartesian3(ib.length_km * 800, ib.width_km * 800, 300.0), // 3D Tabular iceberg volume
          material: new Cesium.ColorMaterialProperty(
            isSelected ? Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.9) : Cesium.Color.WHITE.withAlpha(0.85)
          ),
          outline: true,
          outlineColor: riskColor,
          outlineWidth: isSelected ? 3 : 1,
        },
        label: {
          text: `[#${ib.id}] ${ib.risk_level}`,
          font: 'bold 11px JetBrains Mono, monospace',
          fillColor: riskColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -25),
        },
      });
    });
  }, [icebergs, selectedIceberg, layers.icebergs]);

  // 4. Render Iceberg Trajectory & Uncertainty Ellipses
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const toRemove = viewer.entities.values.filter(
      (e) => e.name === 'trajectory_entity' || e.name === 'uncertainty_entity'
    );
    toRemove.forEach((e) => viewer.entities.remove(e));

    if (!layers.trajectories || !trajectory || trajectory.trajectory.length < 2) return;

    // Trajectory Polyline
    const positions = trajectory.trajectory.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 50.0)
    );

    viewer.entities.add({
      name: 'trajectory_entity',
      polyline: {
        positions,
        width: 3,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString('#f59e0b'),
          dashLength: 16.0,
        }),
      },
    });

    // Uncertainty Ellipses along waypoints
    trajectory.uncertainty.forEach((u, i) => {
      const pt = trajectory.trajectory[i + 1];
      if (!pt) return;

      viewer.entities.add({
        name: 'uncertainty_entity',
        position: Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, 10.0),
        ellipse: {
          semiMajorAxis: u.semi_major_km * 1000.0,
          semiMinorAxis: u.semi_minor_km * 1000.0,
          rotation: Cesium.Math.toRadians(u.orientation_deg),
          material: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.18),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.6),
          outlineWidth: 1,
        },
        label: {
          text: `+${u.hour}h (${u.confidence_pct}%)`,
          font: '10px JetBrains Mono, monospace',
          fillColor: Cesium.Color.fromCssColorString('#f59e0b'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, 15),
        },
      });
    });
  }, [trajectory, layers.trajectories]);

  // 5. Render Navigation Routes (A* Candidates)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const toRemove = viewer.entities.values.filter((e) => e.name === 'route_entity');
    toRemove.forEach((e) => viewer.entities.remove(e));

    if (!layers.routes || routes.length === 0) return;

    routes.forEach((route) => {
      const isSelected = selectedRoute?.route_id === route.route_id;
      const positions = route.waypoints.map((wp) =>
        Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, 80.0)
      );

      let color = Cesium.Color.fromCssColorString('#38bdf8'); // Fuel optimal (blue)
      if (route.route_id === 'shortest') {
        color = Cesium.Color.fromCssColorString('#f59e0b'); // Shortest (amber)
      } else if (route.route_id === 'ai_recommended' || route.route_id === 'replanned_safe') {
        color = Cesium.Color.fromCssColorString('#10b981'); // AI Recommended (green/emerald)
      }

      viewer.entities.add({
        name: 'route_entity',
        polyline: {
          positions,
          width: isSelected ? 5 : 2,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: isSelected ? 0.35 : 0.1,
            color: isSelected ? color : color.withAlpha(0.6),
          }),
        },
      });
    });
  }, [routes, selectedRoute, layers.routes]);

  // 6. Render Research Vessel Object (3D Vessel position & Heading)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const toRemove = viewer.entities.values.filter((e) => e.name === 'vessel_entity');
    toRemove.forEach((e) => viewer.entities.remove(e));

    if (!layers.vessel) return;

    const pos = simulation
      ? simulation.vessel_position
      : { lat: -62.30, lon: -59.20 };
    const heading = simulation ? simulation.vessel_heading_deg : 125.0;

    const hpr = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(heading - 90.0),
      0.0,
      0.0
    );
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, 30.0),
      hpr
    );

    // 3D Research Vessel Entity
    viewer.entities.add({
      name: 'vessel_entity',
      position: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, 30.0),
      orientation: orientation,
      box: {
        dimensions: new Cesium.Cartesian3(850.0, 180.0, 220.0), // Vessel hull dimensions in meters
        material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString('#00f0ff')),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
      },
      label: {
        text: `R/V POLARIS (${simulation?.vessel_speed_knots || 12.0} kn)`,
        font: 'bold 12px JetBrains Mono, monospace',
        fillColor: Cesium.Color.fromCssColorString('#00f0ff'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
      },
    });
  }, [simulation, layers.vessel]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
