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

import "../../__mocks__/ReactWithSupervisor";
import { fireEvent, render } from "@testing-library/react";
import {
  activateSelector,
  EDIT_EXPRESSION_DATA_TYPE,
  flushPromises,
  usingTestingBoxedExpressionI18nContext,
  wrapComponentInContext,
} from "../test-utils";
import { DEFAULT_FIRST_PARAM_NAME, FunctionExpression } from "../../../components/FunctionExpression";
import * as React from "react";
import { DataType, EntryInfo, FunctionKind, FunctionProps, LogicType } from "../../../api";
import { act } from "react-dom/test-utils";
import * as _ from "lodash";

describe("FunctionExpression tests", () => {
  const parameterId = "p1";
  const documentName = "document";
  const modelName = "model";

  test("should show a table with two levels visible header, with one row and one column", () => {
    const { container } = render(
      usingTestingBoxedExpressionI18nContext(
        <FunctionExpression logicType={LogicType.Function} functionKind={FunctionKind.Feel} formalParameters={[]} />
      ).wrapper
    );

    expect(container.querySelector(".function-expression")).toBeTruthy();
    expect(container.querySelector(".function-expression table")).toBeTruthy();
    expect(container.querySelector(".function-expression table thead")).toBeTruthy();
    expect(container.querySelectorAll(".function-expression table thead tr")).toHaveLength(2);
    expect(container.querySelectorAll(".function-expression table tbody tr")).toHaveLength(1);
    expect(container.querySelectorAll(".function-expression table tbody td.data-cell")).toHaveLength(1);
  });

  test("should show a section in the header, with the list of parameters", () => {
    const { container } = render(
      usingTestingBoxedExpressionI18nContext(
        <FunctionExpression
          logicType={LogicType.Function}
          functionKind={FunctionKind.Feel}
          formalParameters={[{ id: "p1", name: DEFAULT_FIRST_PARAM_NAME, dataType: DataType.Undefined }]}
        />
      ).wrapper
    );

    expect(container.querySelector(".function-expression table thead .parameters-list")).toBeTruthy();
    expect(container.querySelector(".function-expression table thead .parameters-list p")).toContainHTML(
      `${DEFAULT_FIRST_PARAM_NAME}`
    );
  });

  test("should reset function kind to FEEL, when resetting table row", async () => {
    const mockedBroadcastDefinition = jest.fn();
    mockBroadcastDefinition(mockedBroadcastDefinition);
    const { container, baseElement } = render(
      usingTestingBoxedExpressionI18nContext(
        <FunctionExpression logicType={LogicType.Function} functionKind={FunctionKind.Java} formalParameters={[]} />
      ).wrapper
    );

    await clearTableRow(container, baseElement);

    expect(mockedBroadcastDefinition).toHaveBeenLastCalledWith({
      dataType: DataType.Undefined,
      expression: {
        logicType: LogicType.LiteralExpression,
      },
      formalParameters: [],
      functionKind: "FEEL",
      logicType: "Function",
      name: "p-1",
      parametersWidth: 370,
      id: undefined,
    });
  });

  describe("Formal Parameters", () => {
    beforeEach(() => {
      jest.clearAllTimers();
    });

    test("should render no parameter, if passed property is empty array", async () => {
      const { container, baseElement } = render(
        usingTestingBoxedExpressionI18nContext(
          wrapComponentInContext(
            <FunctionExpression logicType={LogicType.Function} functionKind={FunctionKind.Feel} formalParameters={[]} />
          )
        ).wrapper
      );
      await activateSelector(container as HTMLElement, ".parameters-list");

      expect(baseElement.querySelector(".parameters-editor")).toBeTruthy();
      expect(baseElement.querySelector(".parameters-editor .parameters-container")).toBeTruthy();
      expect(baseElement.querySelectorAll(".parameters-editor .parameters-container .parameter-entry")).toHaveLength(0);
    });

    test("should render all parameters, belonging to the passed property", async () => {
      const paramName = "param";
      const paramDataType = DataType.Any;

      const { container, baseElement } = render(
        usingTestingBoxedExpressionI18nContext(
          wrapComponentInContext(
            <FunctionExpression
              logicType={LogicType.Function}
              functionKind={FunctionKind.Feel}
              formalParameters={[{ id: parameterId, name: paramName, dataType: paramDataType }]}
            />
          )
        ).wrapper
      );
      await activateSelector(container as HTMLElement, ".parameters-list");

      expect(baseElement.querySelectorAll(".parameters-editor .parameters-container .parameter-entry")).toHaveLength(1);
      expect((baseElement.querySelector(".parameter-name") as HTMLInputElement).value).toBe(paramName);
      expect((baseElement.querySelector(EDIT_EXPRESSION_DATA_TYPE)! as HTMLInputElement).value).toBe(paramDataType);
    });

    test("should update the parameter name, when it gets changed by the user", async () => {
      const newParamName = "new param";
      const mockedBroadcastDefinition = jest.fn();
      mockBroadcastDefinition(mockedBroadcastDefinition);

      const { container, baseElement } = render(
        usingTestingBoxedExpressionI18nContext(
          wrapComponentInContext(
            <FunctionExpression
              logicType={LogicType.Function}
              functionKind={FunctionKind.Feel}
              formalParameters={[{ id: parameterId, name: "param", dataType: DataType.Any }]}
            />
          )
        ).wrapper
      );
      await activateSelector(container as HTMLElement, ".parameters-list");
      await act(async () => {
        const input = baseElement.querySelector(".parameter-name") as HTMLInputElement;
        fireEvent.blur(input, { target: { value: newParamName } });
      });

      checkFormalParameters(mockedBroadcastDefinition, [
        {
          id: parameterId,
          dataType: DataType.Any,
          name: `${newParamName}`,
        },
      ]);
    });

    test("should update the parameter data type, when it gets changed by the user", async () => {
      const mockedBroadcastDefinition = jest.fn();
      mockBroadcastDefinition(mockedBroadcastDefinition);

      const { container, baseElement } = render(
        usingTestingBoxedExpressionI18nContext(
          wrapComponentInContext(
            <FunctionExpression
              logicType={LogicType.Function}
              functionKind={FunctionKind.Feel}
              formalParameters={[{ id: parameterId, name: "param", dataType: DataType.Undefined }]}
            />
          )
        ).wrapper
      );
      await activateSelector(container as HTMLElement, ".parameters-list");
      await act(async () => {
        (
          baseElement.querySelector("[data-ouia-component-id='edit-expression-data-type'] button") as HTMLButtonElement
        ).click();
        await flushPromises();
        jest.runAllTimers();
        (baseElement.querySelector(`[data-ouia-component-id='${DataType.Boolean}']`) as HTMLButtonElement).click();
      });

      checkFormalParameters(mockedBroadcastDefinition, [
        {
          id: parameterId,
          dataType: DataType.Boolean,
          name: "param",
        },
      ]);
    });

    test("should add a new parameter, when the user adds it", async () => {
      const mockedBroadcastDefinition = jest.fn();
      mockBroadcastDefinition(mockedBroadcastDefinition);

      const { container, baseElement } = render(
        usingTestingBoxedExpressionI18nContext(
          wrapComponentInContext(
            <FunctionExpression logicType={LogicType.Function} functionKind={FunctionKind.Feel} formalParameters={[]} />
          )
        ).wrapper
      );
      await activateSelector(container as HTMLElement, ".parameters-list");
      await act(async () => {
        (baseElement.querySelector("button.add-parameter") as HTMLButtonElement).click();
      });

      checkFormalParameters(mockedBroadcastDefinition, [
        expect.objectContaining({
          dataType: DataType.Undefined,
          name: DEFAULT_FIRST_PARAM_NAME,
        }),
      ]);
    });

    test("should have no parameter, when the user delete the only existing one", async () => {
      const mockedBroadcastDefinition = jest.fn();
      mockBroadcastDefinition(mockedBroadcastDefinition);

      const { container, baseElement } = render(
        usingTestingBoxedExpressionI18nContext(
          wrapComponentInContext(
            <FunctionExpression
              logicType={LogicType.Function}
              functionKind={FunctionKind.Feel}
              formalParameters={[
                {
                  id: parameterId,
                  dataType: DataType.Undefined,
                  name: DEFAULT_FIRST_PARAM_NAME,
                },
              ]}
            />
          )
        ).wrapper
      );
      await activateSelector(container as HTMLElement, ".parameters-list");
      await act(async () => {
        (baseElement.querySelector("button.delete-parameter") as HTMLButtonElement).click();
      });

      checkFormalParameters(mockedBroadcastDefinition, []);
    });

    function checkFormalParameters(mockedBroadcastDefinition: jest.Mock, formalParameters: EntryInfo[]) {
      expect(mockedBroadcastDefinition).toHaveBeenCalledWith({
        dataType: DataType.Undefined,
        expression: {
          logicType: "Literal expression",
        },
        formalParameters,
        functionKind: "FEEL",
        logicType: "Function",
        name: "p-1",
        parametersWidth: 370,
        id: undefined,
      });
    }
  });

  describe("FEEL Function Kind", () => {
    test("should show, by default, an entry with an empty literal expression", () => {
      const { container } = render(
        usingTestingBoxedExpressionI18nContext(
          <FunctionExpression logicType={LogicType.Function} functionKind={FunctionKind.Feel} formalParameters={[]} />
        ).wrapper
      );

      expect(container.querySelector(".function-expression table tbody td.data-cell")).toBeVisible();
      expect(container.querySelector(".function-expression table tbody td.data-cell .literal-expression")).toBeTruthy();
      expect(
        (
          container.querySelector(
            ".function-expression table tbody td.data-cell .literal-expression textarea"
          ) as HTMLTextAreaElement
        ).value
      ).toBe("");
    });

    test("should show an entry corresponding to the passed expression", () => {
      const { container } = render(
        usingTestingBoxedExpressionI18nContext(
          <FunctionExpression
            logicType={LogicType.Function}
            functionKind={FunctionKind.Feel}
            formalParameters={[]}
            expression={{
              id: "id2",
              logicType: LogicType.Relation,
            }}
          />
        ).wrapper
      );

      expect(container.querySelector(".function-expression table tbody td.data-cell")).toBeVisible();
      expect(
        container.querySelector(".function-expression table tbody td.data-cell .relation-expression")
      ).toBeTruthy();
      expect(
        container.querySelector(".function-expression table tbody td.data-cell .relation-expression table")
      ).toBeTruthy();
    });
  });

  describe("JAVA Function Kind", () => {
    test("should show, by default, an entry with a context table, containing two entries: class and method", () => {
      const { container } = render(
        usingTestingBoxedExpressionI18nContext(
          <FunctionExpression logicType={LogicType.Function} functionKind={FunctionKind.Java} formalParameters={[]} />
        ).wrapper
      );

      checkContextEntries(container, "class", "method");
    });

    test("should show an entry corresponding to the passed class and method values", () => {
      const classValue = "class value";
      const methodValue = "method value";

      const { container } = render(
        usingTestingBoxedExpressionI18nContext(
          <FunctionExpression
            logicType={LogicType.Function}
            functionKind={FunctionKind.Java}
            formalParameters={[]}
            className={classValue}
            methodName={methodValue}
          />
        ).wrapper
      );

      checkContextEntries(container, classValue, methodValue, true);
    });
  });

  describe("PMML Function Kind", () => {
    test("should show, by default, an entry with a context table, containing two entries: document and model", () => {
      const { container } = render(
        usingTestingBoxedExpressionI18nContext(
          <FunctionExpression logicType={LogicType.Function} functionKind={FunctionKind.Pmml} formalParameters={[]} />
        ).wrapper
      );

      checkContextEntries(container, "document", "model");
    });

    test("should show an entry corresponding to the passed document and model values", () => {
      const document = "document";
      const model = "model";

      const { container } = render(
        usingTestingBoxedExpressionI18nContext(
          <FunctionExpression
            logicType={LogicType.Function}
            functionKind={FunctionKind.Pmml}
            formalParameters={[]}
            document={document}
            model={model}
          />
        ).wrapper
      );

      checkContextEntries(container, document, model, true);
    });

    test("should populate parameters list with parameters related to selected PMML model", async () => {
      const mockedBroadcastDefinition = jest.fn();

      let props: FunctionProps = {
        logicType: LogicType.Function,
        functionKind: FunctionKind.Pmml,
        formalParameters: [],
      };

      const mockBroadcastDefinition = () => {
        window.beeApi = _.extend(window.beeApi || {}, {
          broadcastFunctionExpressionDefinition: (definition: FunctionProps) => {
            props = {
              ...props,
              ...definition,
            };
            mockedBroadcastDefinition(definition);
          },
        });
      };
      mockBroadcastDefinition();

      const screen = render(
        usingTestingBoxedExpressionI18nContext(wrapComponentInContext(<FunctionExpression {...props} />)).wrapper
      );

      await act(async () => {
        fireEvent.click(screen.container.querySelectorAll(".pmml-literal-expression button")[0]! as HTMLElement);
        fireEvent.click(await screen.findByTestId("pmml-selector-document"));
        fireEvent.click(await screen.findByTestId("pmml-document"));
      });

      screen.rerender(
        usingTestingBoxedExpressionI18nContext(wrapComponentInContext(<FunctionExpression {...props} />)).wrapper
      );
      await act(async () => {
        fireEvent.click(screen.container.querySelectorAll(".pmml-literal-expression button")[1]! as HTMLElement);
        fireEvent.click(await screen.findByTestId("pmml-selector-model"));
        fireEvent.click(await screen.findByTestId("pmml-model"));
      });

      expect(mockedBroadcastDefinition).toHaveBeenLastCalledWith(
        expect.objectContaining({
          document: documentName,
          model: modelName,
        })
      );
    });
  });

  function mockBroadcastDefinition(mockedBroadcastDefinition: jest.Mock) {
    // noinspection JSVoidFunctionReturnValueUsed
    window.beeApi = _.extend(window.beeApi || {}, {
      broadcastFunctionExpressionDefinition: (definition: FunctionProps) => mockedBroadcastDefinition(definition),
    });
  }

  async function clearTableRow(container: Element, baseElement: Element) {
    await act(async () => {
      fireEvent.contextMenu(
        container.querySelector(".function-expression table tbody td.counter-cell") as HTMLTableElement
      );
      await flushPromises();
      jest.runAllTimers();
    });

    await act(async () => {
      fireEvent.click(
        baseElement.querySelector(
          "[data-ouia-component-id='expression-table-handler-menu-Clear'] button"
        )! as HTMLButtonElement
      );
      await flushPromises();
      jest.runAllTimers();
    });
  }

  function checkContextEntries(container: Element, firstEntry: string, secondEntry: string, checkExpression = false) {
    const specificClassToCheck = checkExpression ? ".context-entry-expression-cell" : ".context-entry-info-cell";
    const entriesSelector = `.function-expression table tbody td.data-cell .context-expression ${specificClassToCheck}`;

    expect(container.querySelector(".function-expression table tbody td.data-cell")).toBeVisible();
    expect(container.querySelector(".function-expression table tbody td.data-cell .context-expression")).toBeTruthy();
    expect(container.querySelectorAll(entriesSelector)).toHaveLength(2);
    expect(container.querySelectorAll(entriesSelector)[0]).toContainHTML(firstEntry);
    expect(container.querySelectorAll(entriesSelector)[1]).toContainHTML(secondEntry);
  }
});

jest.useFakeTimers();
