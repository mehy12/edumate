"use client";

import * as go from "gojs";
import { useEffect, useRef } from "react";

export type RoadmapNode = {
  id: string;
  label: string;
  type: string; // e.g. "concept" | "class"
};

export type RoadmapLink = {
  from: string;
  to: string;
};

interface RoadmapGraphProps {
  nodes: RoadmapNode[];
  links: RoadmapLink[];
}

export function RoadmapGraph({ nodes, links }: RoadmapGraphProps) {
  const diagramRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!diagramRef.current) return;

    const $ = go.GraphObject.make;

    const diagram = $(go.Diagram, diagramRef.current, {
      "undoManager.isEnabled": false,
      layout: $(go.LayeredDigraphLayout, {
        direction: 0,
        layerSpacing: 40,
        columnSpacing: 20,
      }),
    });

    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      $(
        go.Shape,
        "RoundedRectangle",
        {
          strokeWidth: 0,
          portId: "",
          cursor: "pointer",
        },
        new go.Binding("fill", "type", (type: string) => {
          switch (type) {
            case "class":
              return "#DBEAFE"; // blue-100
            case "concept":
            default:
              return "#ECFEFF"; // cyan-50
          }
        }),
      ),
      $(
        go.TextBlock,
        {
          margin: 8,
          font: "bold 12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          stroke: "#0F172A",
          maxSize: new go.Size(160, NaN),
          wrap: go.TextBlock.WrapFit,
        },
        new go.Binding("text", "label"),
      ),
    );

    diagram.linkTemplate = $(
      go.Link,
      {
        routing: go.Link.AvoidsNodes,
        corner: 5,
        curve: go.Link.JumpGap,
      },
      $(go.Shape, { stroke: "#CBD5F5", strokeWidth: 1.5 }),
      $(go.Shape, { toArrow: "Standard", fill: "#CBD5F5", stroke: "#CBD5F5" }),
    );

    diagram.model = new go.GraphLinksModel(
      nodes.map((n) => ({ key: n.id, label: n.label, type: n.type })),
      links.map((l) => ({ from: l.from, to: l.to })),
    );

    return () => {
      diagram.div = null;
      diagram.dispose();
    };
  }, [nodes, links]);

  return (
    <div
      ref={diagramRef}
      className="w-full h-80 rounded-lg border border-border bg-muted/40 overflow-hidden"
    />
  );
}
