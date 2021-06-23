import { OperationDefinitionNode } from 'graphql';
import { Source } from '@graphql-tools/utils';

export function getOperationDefinitionNodes(
  sources: Source[]
): OperationDefinitionNode[] {
  return sources.reduce<OperationDefinitionNode[]>((sourceAcc, source) => {
    return source.document.definitions.reduce((defAcc, def) => {
      if (def.kind == 'OperationDefinition') {
        return defAcc.concat(def)
      }
      return defAcc
    }, sourceAcc);
  }, [])
}
