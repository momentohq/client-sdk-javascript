// import {IMomentoCache} from '../../../src/clients/IMomentoCache';

import {
  Project,
  // VariableDeclarationKind,
  // InterfaceDeclaration
} from 'ts-morph';

// initName is name of the interface file below the root, ./src is considered the root
// const Keys = (intName: string): string[] => {
//   const project = new Project();
//   const sourceFile = project.addSourceFileAtPath(`./src/${intName}.ts`);
//   const node = sourceFile.getInterface(intName)!;
//   const allKeys = node.getProperties().map(p => p.getName());
//
//   return allKeys;
// };

// export default Keys;

describe('IMomentoCache', () => {
  it('has all of the data plane methods that exist on the ICacheClient interface', () => {
    const project = new Project();
    const cacheInterfaceSourceFile = project.addSourceFileAtPath(
      './src/clients/IMomentoCache.ts'
    );
    const cacheInterface =
      cacheInterfaceSourceFile.getInterface('IMomentoCache');
    const cacheInterfaceMembers = cacheInterface!
      .getMethods()
      .map(m => m.getName())
      .sort();
    console.log(`Cache interface members: ${cacheInterfaceMembers.join(',')}`);

    const clientInterfaceSourceFile = project.addSourceFileAtPath(
      './src/clients/ICacheClient.ts'
    );
    const clientInterface =
      clientInterfaceSourceFile.getInterface('ICacheClient');
    const clientInterfaceMembers = clientInterface!
      .getMethods()
      .map(m => m.getName())
      .sort();
    console.log(
      `Client interface members: ${clientInterfaceMembers.join(',')}`
    );
    // console.log(

    // Object.getOwnPropertyNames(IMomentoCache).filter(p => {
    //   return typeof Math[p] === 'function';
    // })
    // );
    expect(true).toEqual(false);
  });
});
