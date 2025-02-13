/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./Resizer.css";
import * as React from "react";
import { applyDOMSupervisor } from "./dom";
import { useEffect, useContext, useState } from "react";
import { BoxedExpressionGlobalContext } from "../../context";

export interface ResizerSupervisorProps {
  children?: React.ReactElement;
  isRunnerTable: boolean;
}

export const ResizerSupervisor: React.FunctionComponent<ResizerSupervisorProps> = ({ children, isRunnerTable }) => {
  const { supervisorHash } = useContext(BoxedExpressionGlobalContext);
  const [resizerSupervisor, setResizer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      if (resizerSupervisor !== null) {
        applyDOMSupervisor(isRunnerTable, resizerSupervisor);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [isRunnerTable, supervisorHash, resizerSupervisor]);

  return <div ref={(element) => setResizer(element)}>{children}</div>;
};
