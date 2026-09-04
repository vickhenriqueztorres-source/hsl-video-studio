import type {Interface} from 'node:readline/promises';
import {ElevenLabsKeys,checkElevenLabsKey} from '../ide/elevenLabsKeys';
import {hiddenQuestion} from './terminal';
export async function elevenLabsMenu(rl:Interface){
  const store=new ElevenLabsKeys();
  for(;;){
    console.log('\n  ELEVENLABS · CHAVES API\n  [1] Adicionar chave       [2] Listar chaves\n  [3] Escolher chave ativa  [4] Testar conexão\n  [5] Remover chave local   [0] Voltar\n  Chaves protegidas pelo Windows, fora do repositório.');
    const action=(await rl.question('  elevenlabs> ')).trim();if(!action||action==='0')return;
    try{
      if(action==='1'){const name=await rl.question('  Apelido (ex.: Principal, Estudio): ');const key=await hiddenQuestion(rl);if(!key){console.log('  Cancelado.');continue;}const id=await store.add(name,key);const entry=(await store.list()).find(e=>e.id===id)!;console.log(`  Chave salva${entry.active?' e ativada':'. Use [3] para ativá-la'}.`);continue;}
      if(!['2','3','4','5'].includes(action)){console.log('  Escolha de 0 a 5.');continue;}
      const entries=await store.list();entries.forEach((e,i)=>console.log(`  [${i+1}] ${e.name} · ID ${e.fingerprint}${e.active?' · ATIVA':''}`));
      if(!entries.length){console.log('  Nenhuma chave cadastrada. A narração mantém a configuração de ambiente existente.');continue;}
      if(!entries.some(e=>e.active))console.log('  Sem chave ativa: a narração usa a configuração de ambiente existente.');
      if(action==='2')continue;
      const value=(await rl.question('  Número da chave [Enter cancela]: ')).trim();if(!value)continue;const entry=/^[1-9]\d*$/.test(value)?entries[Number(value)-1]:undefined;if(!entry){console.log('  Número inválido.');continue;}
      if(action==='3'){await store.activate(entry.id);console.log('  Chave ativa atualizada para a próxima narração. Áudio em cache será reutilizado.');}
      else if(action==='4'){console.log('  Consultando conta, sem gerar áudio...');const result=await checkElevenLabsKey(await store.key(entry.id));console.log('  '+result.message);if(result.ok&&'used'in result)console.log(`  Uso informado pela conta: ${result.used??'—'} / ${result.limit??'—'} (não é saldo específico da chave).`);}
      else if((await rl.question(`  Remover ${entry.name} deste computador? Digite REMOVER: `)).trim()==='REMOVER'){await store.remove(entry.id);console.log('  Cadastro local removido. A chave não foi revogada na ElevenLabs.');}
    }catch(e){console.log('  '+(e instanceof Error?e.message:'Não foi possível gerenciar a chave.'));}
  }
}
