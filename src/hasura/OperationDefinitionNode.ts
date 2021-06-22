import { OperationDefinitionNode } from 'graphql';
import { Source } from '@graphql-tools/utils';

export function createOperationDefinitionNodes(
  sources: Source[]
): OperationDefinitionNode[] {
  const definitionNodes: OperationDefinitionNode[] = [];
  sources.forEach(source => {
    source.document.definitions.forEach(def =>
      definitionNodes.push(def as OperationDefinitionNode)
    );
  });

  return definitionNodes;
}
