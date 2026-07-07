import { useEffect, useMemo, useRef, useState } from 'react';
import InputArquivoCustomizado from './InputArquivoCustomizado.jsx';
import { TIPOS_ALTA } from '../utils/altas';
import { TIPOS_COMBINADO, TIPO_RESSOCIALIZACAO } from '../utils/combinados';
import {
  dataParaIso,
  isoParaData,
  maskCelular,
  maskCpf,
  maskData,
} from '../utils/masks';

const TIPOS_ANEXO = [
  { valor: 'ATESTADO', rotulo: 'Atestado' },
  { valor: 'RECEITA', rotulo: 'Receita' },
  { valor: 'DOCUMENTO', rotulo: 'Documento' },
  { valor: 'OUTRO', rotulo: 'Outro' },
];

const ANEXO_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.xlsx,application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const ANEXO_TAMANHO_MAX = 10 * 1024 * 1024; // 10 MB (espelha o backend)
const FOTO_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
const FOTO_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

const rotuloTipoAnexo = (tipo) =>
  TIPOS_ANEXO.find((t) => t.valor === tipo)?.rotulo ?? tipo;

const nomePadraoArquivo = (nomeArquivo) => {
  if (!nomeArquivo) return '';
  const ponto = nomeArquivo.lastIndexOf('.');
  return ponto > 0 ? nomeArquivo.substring(0, ponto) : nomeArquivo;
};

const FORM_INICIAL = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  dataAcolhimentoCtav: '',
  email: '',
  telefone: '',
  sexo: '',
  endereco: '',
  quarto: '',
  alta: false,
  dataAlta: '',
  tipoAlta: '',
  motivoAdesaoId: '',
  motivoDesistenciaId: '',
};

const hojeComoIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
};

const truncarDescricao = (texto, max = 72) => {
  if (!texto) return '';
  const t = String(texto).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
};

export default function AcolhidoForm({
  acolhidoEditando,
  medicamentosDisponiveis = [],
  motivosAdesao = [],
  motivosDesistencia = [],
  modoHistorico = false,
  onSalvar,
  onCancelar,
  onVerLista,
  salvando,
}) {
  const editando = Boolean(acolhidoEditando);
  // Doses por período, combinados e anexos ficam disponíveis tanto no cadastro
  // quanto na edição, deixando o formulário de edição tão completo quanto o de
  // cadastro. Na edição, as doses vêm pré-carregadas da prescrição atual.
  const permitirDosesECombinados = true;

  const [abaAtiva, setAbaAtiva] = useState('gerais');
  const [form, setForm] = useState(FORM_INICIAL);
  const [medicamentosSelecionadosIds, setMedicamentosSelecionadosIds] = useState([]);
  const [dosesPorMedicamento, setDosesPorMedicamento] = useState({});
  const [destaqueDisponivel, setDestaqueDisponivel] = useState(null);
  const [destaqueSelecionado, setDestaqueSelecionado] = useState(null);
  const [erros, setErros] = useState({});

  // Combinados a serem criados junto ao acolhido (somente no cadastro no histórico).
  const [combinadosPendentes, setCombinadosPendentes] = useState([]);
  const [combinadoTipo, setCombinadoTipo] = useState('');
  const [combinadoDescricao, setCombinadoDescricao] = useState('');
  const [combinadoDataIda, setCombinadoDataIda] = useState('');
  const [combinadoDataVolta, setCombinadoDataVolta] = useState('');
  const [combinadoData, setCombinadoData] = useState('');
  const [anexosPendentes, setAnexosPendentes] = useState([]);
  const [anexoTipo, setAnexoTipo] = useState('DOCUMENTO');
  const [anexoNome, setAnexoNome] = useState('');
  const [anexoArquivo, setAnexoArquivo] = useState(null);
  const anexoInputRef = useRef(null);
  const anexosPendentesRef = useRef([]);

  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [fotoRemovida, setFotoRemovida] = useState(false);
  const fotoInputRef = useRef(null);
  const fotoPreviewRef = useRef('');

  useEffect(() => {
    anexosPendentesRef.current = anexosPendentes;
  }, [anexosPendentes]);

  useEffect(() => {
    fotoPreviewRef.current = fotoPreview;
  }, [fotoPreview]);

  // revoga a URL de pré-visualização da foto ao desmontar
  useEffect(
    () => () => {
      if (fotoPreviewRef.current) URL.revokeObjectURL(fotoPreviewRef.current);
    },
    []
  );

  // revoga as URLs de pré-visualização ao desmontar
  useEffect(
    () => () => {
      anexosPendentesRef.current.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    },
    []
  );

  const limparAnexosPendentes = () => {
    anexosPendentesRef.current.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    setAnexosPendentes([]);
    setAnexoTipo('DOCUMENTO');
    setAnexoNome('');
    setAnexoArquivo(null);
    if (anexoInputRef.current) anexoInputRef.current.value = '';
  };

  const limparFoto = () => {
    if (fotoPreviewRef.current) URL.revokeObjectURL(fotoPreviewRef.current);
    setFotoArquivo(null);
    setFotoPreview('');
    setFotoRemovida(false);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
  };

  useEffect(() => {
    if (acolhidoEditando) {
      setForm({
        nome: acolhidoEditando.nome ?? '',
        cpf: maskCpf(acolhidoEditando.cpf ?? ''),
        dataNascimento: isoParaData(acolhidoEditando.dataNascimento),
        dataAcolhimentoCtav: isoParaData(acolhidoEditando.dataAcolhimentoCtav),
        email: acolhidoEditando.email ?? '',
        telefone: maskCelular(acolhidoEditando.telefone ?? ''),
        sexo: acolhidoEditando.sexo ?? '',
        endereco: acolhidoEditando.endereco ?? '',
        quarto: acolhidoEditando.quarto ?? '',
        alta: Boolean(acolhidoEditando.alta),
        dataAlta: isoParaData(acolhidoEditando.dataAlta),
        tipoAlta: acolhidoEditando.tipoAlta ?? '',
        motivoAdesaoId:
          acolhidoEditando.motivoAdesaoId != null
            ? String(acolhidoEditando.motivoAdesaoId)
            : '',
        motivoDesistenciaId:
          acolhidoEditando.motivoDesistenciaId != null
            ? String(acolhidoEditando.motivoDesistenciaId)
            : '',
      });
      const prescricoes = Array.isArray(acolhidoEditando.prescricoes)
        ? acolhidoEditando.prescricoes.filter((p) => p?.medicamentoId != null)
        : [];
      setMedicamentosSelecionadosIds(prescricoes.map((p) => p.medicamentoId));
      // Pré-carrega as doses atuais para que a aba Medicações reflita a
      // prescrição existente (e não zere as doses ao salvar).
      const doses = {};
      prescricoes.forEach((p) => {
        doses[p.medicamentoId] = {
          manha: p.doseManha ?? 0,
          tarde: p.doseTarde ?? 0,
          noite: p.doseNoite ?? 0,
        };
      });
      setDosesPorMedicamento(doses);
    } else {
      // No cadastro direto no histórico, a alta já entra marcada.
      setForm(modoHistorico ? { ...FORM_INICIAL, alta: true } : FORM_INICIAL);
      setMedicamentosSelecionadosIds([]);
      setDosesPorMedicamento({});
    }
    setCombinadosPendentes([]);
    setCombinadoTipo('');
    setCombinadoDescricao('');
    setCombinadoDataIda('');
    setCombinadoDataVolta('');
    setCombinadoData('');
    setDestaqueDisponivel(null);
    setDestaqueSelecionado(null);
    setErros({});
    setAbaAtiva('gerais');
    limparAnexosPendentes();
    limparFoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acolhidoEditando]);

  const medicamentosDisponiveisOrdenados = useMemo(
    () => [...medicamentosDisponiveis].sort((a, b) => a.nome.localeCompare(b.nome)),
    [medicamentosDisponiveis]
  );

  const medicamentosNaoSelecionados = useMemo(
    () =>
      medicamentosDisponiveisOrdenados.filter(
        (m) => !medicamentosSelecionadosIds.includes(m.id)
      ),
    [medicamentosDisponiveisOrdenados, medicamentosSelecionadosIds]
  );

  const medicamentosSelecionados = useMemo(() => {
    const mapa = new Map(medicamentosDisponiveisOrdenados.map((m) => [m.id, m]));
    return medicamentosSelecionadosIds
      .map((id) => mapa.get(id))
      .filter(Boolean);
  }, [medicamentosDisponiveisOrdenados, medicamentosSelecionadosIds]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'alta') {
      setForm((atual) => ({
        ...atual,
        alta: checked,
        // ao desmarcar a alta, limpa a data, o tipo e o motivo de desistência
        dataAlta: checked ? atual.dataAlta : '',
        tipoAlta: checked ? atual.tipoAlta : '',
        motivoDesistenciaId: checked ? atual.motivoDesistenciaId : '',
      }));
      if (!checked) {
        setErros((atual) => {
          const copia = { ...atual };
          delete copia.dataAlta;
          delete copia.tipoAlta;
          delete copia.motivoDesistenciaId;
          return copia;
        });
      }
      return;
    }

    // Ao mudar o tipo de alta para algo diferente de desistência, o motivo de
    // desistência deixa de fazer sentido.
    if (name === 'tipoAlta') {
      setForm((atual) => ({
        ...atual,
        tipoAlta: value,
        motivoDesistenciaId:
          value === 'DESISTENCIA' ? atual.motivoDesistenciaId : '',
      }));
      if (value !== 'DESISTENCIA') {
        setErros((atual) => {
          const copia = { ...atual };
          delete copia.motivoDesistenciaId;
          return copia;
        });
      }
      return;
    }

    let novoValor = type === 'checkbox' ? checked : value;

    if (name === 'cpf') novoValor = maskCpf(value);
    else if (name === 'telefone') novoValor = maskCelular(value);
    else if (
      name === 'dataNascimento' ||
      name === 'dataAcolhimentoCtav' ||
      name === 'dataAlta'
    )
      novoValor = maskData(value);

    setForm((atual) => ({ ...atual, [name]: novoValor }));
  };

  const incluirMedicamento = (id) => {
    if (id == null) return;
    setMedicamentosSelecionadosIds((atual) =>
      atual.includes(id) ? atual : [...atual, id]
    );
    setDestaqueDisponivel(null);
  };

  const removerMedicamento = (id) => {
    if (id == null) return;
    setMedicamentosSelecionadosIds((atual) => atual.filter((x) => x !== id));
    setDosesPorMedicamento((atual) => {
      const copia = { ...atual };
      delete copia[id];
      return copia;
    });
    setDestaqueSelecionado(null);
  };

  const incluirTodosMedicamentos = () => {
    setMedicamentosSelecionadosIds(
      medicamentosDisponiveisOrdenados.map((m) => m.id)
    );
    setDestaqueDisponivel(null);
  };

  const removerTodosMedicamentos = () => {
    setMedicamentosSelecionadosIds([]);
    setDosesPorMedicamento({});
    setDestaqueSelecionado(null);
  };

  const doseDoMedicamento = (id) =>
    dosesPorMedicamento[id] ?? { manha: 0, tarde: 0, noite: 0 };

  const atualizarDose = (id, periodo, valor) => {
    const numero = Math.max(0, parseInt(valor, 10) || 0);
    setDosesPorMedicamento((atual) => ({
      ...atual,
      [id]: { ...doseDoMedicamento(id), [periodo]: numero },
    }));
  };

  const ehRessocializacaoCombinado = combinadoTipo === TIPO_RESSOCIALIZACAO;

  const adicionarCombinado = () => {
    const descricao = combinadoDescricao.trim();
    const novosErros = {};
    if (!combinadoTipo) novosErros.combinadoTipo = 'Selecione o tipo do combinado.';
    if (!descricao || descricao.length < 2) {
      novosErros.combinadoDescricao = 'Informe uma descrição com pelo menos 2 caracteres.';
    }
    let isoIda = null;
    let isoVolta = null;
    let isoData = null;
    if (ehRessocializacaoCombinado) {
      isoIda = dataParaIso(combinadoDataIda);
      isoVolta = dataParaIso(combinadoDataVolta);
      if (!isoIda) novosErros.combinadoDataIda = 'Informe uma data de ida válida.';
      if (!isoVolta) novosErros.combinadoDataVolta = 'Informe uma data de volta válida.';
      if (isoIda && isoVolta && isoVolta < isoIda) {
        novosErros.combinadoDataVolta = 'A volta não pode ser anterior à ida.';
      }
    } else if (combinadoTipo) {
      if (!combinadoData.trim()) {
        novosErros.combinadoData = 'Informe a data do combinado.';
      } else {
        isoData = dataParaIso(combinadoData);
        if (!isoData) novosErros.combinadoData = 'Data inválida.';
      }
    }
    if (Object.keys(novosErros).length > 0) {
      setErros((atual) => ({ ...atual, ...novosErros }));
      return;
    }

    setCombinadosPendentes((atual) => [
      ...atual,
      {
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        tipo: combinadoTipo,
        descricao,
        dataIda: ehRessocializacaoCombinado ? isoIda : null,
        dataVolta: ehRessocializacaoCombinado ? isoVolta : null,
        dataCombinado: ehRessocializacaoCombinado ? null : isoData,
      },
    ]);
    setCombinadoTipo('');
    setCombinadoDescricao('');
    setCombinadoDataIda('');
    setCombinadoDataVolta('');
    setCombinadoData('');
    setErros((atual) => {
      const copia = { ...atual };
      delete copia.combinadoTipo;
      delete copia.combinadoDescricao;
      delete copia.combinadoDataIda;
      delete copia.combinadoDataVolta;
      delete copia.combinadoData;
      return copia;
    });
  };

  const removerCombinadoPendente = (localId) => {
    setCombinadosPendentes((atual) => atual.filter((c) => c.localId !== localId));
  };

  const validar = () => {
    const novosErros = {};

    if (!form.nome.trim()) novosErros.nome = 'Informe o nome';

    const cpfDigitos = form.cpf.replace(/\D/g, '');
    if (!cpfDigitos) {
      novosErros.cpf = 'Informe o CPF';
    } else if (cpfDigitos.length !== 11) {
      novosErros.cpf = 'CPF deve ter 11 dígitos';
    }

    if (!form.dataNascimento.trim()) {
      novosErros.dataNascimento = 'Informe a data de nascimento';
    } else {
      const iso = dataParaIso(form.dataNascimento);
      if (!iso) {
        novosErros.dataNascimento = 'Data inválida';
      } else if (new Date(iso) > new Date()) {
        novosErros.dataNascimento = 'A data deve estar no passado';
      }
    }

    const hoje = hojeComoIso();
    if (!form.dataAcolhimentoCtav.trim()) {
      novosErros.dataAcolhimentoCtav = 'Informe a data de acolhimento na CTAV';
    } else {
      const isoAcolhimento = dataParaIso(form.dataAcolhimentoCtav);
      if (!isoAcolhimento) {
        novosErros.dataAcolhimentoCtav = 'Data inválida';
      } else if (isoAcolhimento > hoje) {
        novosErros.dataAcolhimentoCtav =
          'A data não pode ser posterior à data atual';
      }
    }

    const telDigitos = form.telefone.replace(/\D/g, '');
    if (telDigitos && telDigitos.length !== 11) {
      novosErros.telefone = 'Celular deve ter DDD + 9 dígitos';
    }

    if (!form.motivoAdesaoId) {
      novosErros.motivoAdesaoId = 'Selecione o motivo de adesão';
    }

    if (form.alta) {
      if (!form.tipoAlta) {
        novosErros.tipoAlta = 'Selecione o tipo da alta';
      }
      if (form.tipoAlta === 'DESISTENCIA' && !form.motivoDesistenciaId) {
        novosErros.motivoDesistenciaId = 'Selecione o motivo da desistência';
      }
      if (!form.dataAlta.trim()) {
        novosErros.dataAlta = 'Informe a data da alta';
      } else {
        const isoAlta = dataParaIso(form.dataAlta);
        if (!isoAlta) {
          novosErros.dataAlta = 'Data inválida';
        } else if (isoAlta > hoje) {
          novosErros.dataAlta = 'A data não pode ser posterior à data atual';
        } else {
          const isoAcolhimento = dataParaIso(form.dataAcolhimentoCtav);
          if (isoAcolhimento && isoAlta < isoAcolhimento) {
            novosErros.dataAlta =
              'A data da alta não pode ser anterior à data de acolhimento';
          }
        }
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const preencherCadastroTeste = () => {
    setForm({
      ...FORM_INICIAL,
      nome: 'João da Silva Teste',
      cpf: maskCpf('52998224725'),
      dataNascimento: '15/05/1990',
      dataAcolhimentoCtav: isoParaData(hojeComoIso()),
      email: 'joao.teste@email.com',
      telefone: maskCelular('11987654321'),
      sexo: 'MASCULINO',
      endereco: 'Rua das Flores, 123, Centro, São Paulo - SP',
      quarto: '101',
      motivoAdesaoId: motivosAdesao[0]?.id ? String(motivosAdesao[0].id) : '',
    });
    setMedicamentosSelecionadosIds(
      medicamentosDisponiveisOrdenados.slice(0, 2).map((m) => m.id)
    );
    setErros({});
  };

  const handleSelecionarFoto = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!FOTO_TIPOS_PERMITIDOS.includes(file.type)) {
      if (fotoInputRef.current) fotoInputRef.current.value = '';
      setErros((atual) => ({
        ...atual,
        foto: 'A foto deve ser uma imagem JPG, PNG ou WEBP.',
      }));
      return;
    }
    if (file.size > ANEXO_TAMANHO_MAX) {
      if (fotoInputRef.current) fotoInputRef.current.value = '';
      setErros((atual) => ({ ...atual, foto: 'A imagem excede o limite de 10 MB.' }));
      return;
    }

    if (fotoPreviewRef.current) URL.revokeObjectURL(fotoPreviewRef.current);
    setFotoArquivo(file);
    setFotoPreview(URL.createObjectURL(file));
    setFotoRemovida(false);
    setErros((atual) => {
      const copia = { ...atual };
      delete copia.foto;
      return copia;
    });
  };

  const handleRemoverFoto = () => {
    if (fotoPreviewRef.current) URL.revokeObjectURL(fotoPreviewRef.current);
    setFotoArquivo(null);
    setFotoPreview('');
    // Em edicao, marca para remover a foto existente no backend ao salvar.
    setFotoRemovida(true);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
  };

  const handleSelecionarAnexo = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setAnexoArquivo(null);
      return;
    }
    if (file.size > ANEXO_TAMANHO_MAX) {
      setAnexoArquivo(null);
      if (anexoInputRef.current) anexoInputRef.current.value = '';
      setErros((atual) => ({ ...atual, anexo: 'Arquivo excede o limite de 10 MB.' }));
      return;
    }
    setAnexoArquivo(file);
    setAnexoNome((atual) => atual.trim() || nomePadraoArquivo(file.name));
    setErros((atual) => {
      const copia = { ...atual };
      delete copia.anexo;
      return copia;
    });
  };

  const handleAdicionarAnexoLista = (e) => {
    if (e) e.preventDefault();
    const nomeFinal = anexoNome.trim();
    if (!nomeFinal || nomeFinal.length < 2) {
      setErros((atual) => ({
        ...atual,
        anexo: 'Informe um nome para o anexo com pelo menos 2 caracteres.',
      }));
      return;
    }
    if (!anexoArquivo) {
      setErros((atual) => ({
        ...atual,
        anexo: 'Selecione um arquivo (PDF, JPG, PNG ou Excel .xlsx).',
      }));
      return;
    }

    const ehImagem = anexoArquivo.type?.startsWith('image/');
    setAnexosPendentes((atual) => [
      ...atual,
      {
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: anexoArquivo,
        tipo: anexoTipo,
        nomeArquivo: nomeFinal,
        ehImagem,
        previewUrl: ehImagem ? URL.createObjectURL(anexoArquivo) : null,
      },
    ]);
    setAnexoArquivo(null);
    setAnexoNome('');
    setAnexoTipo('DOCUMENTO');
    if (anexoInputRef.current) anexoInputRef.current.value = '';
    setErros((atual) => {
      const copia = { ...atual };
      delete copia.anexo;
      return copia;
    });
  };

  const removerAnexoPendente = (localId) => {
    setAnexosPendentes((atual) => {
      const alvo = atual.find((a) => a.localId === localId);
      if (alvo?.previewUrl) URL.revokeObjectURL(alvo.previewUrl);
      return atual.filter((a) => a.localId !== localId);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) {
      // Os campos validados ficam na aba "Informações gerais".
      setAbaAtiva('gerais');
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf,
      dataNascimento: dataParaIso(form.dataNascimento),
      dataAcolhimentoCtav: dataParaIso(form.dataAcolhimentoCtav),
      email: form.email || null,
      telefone: form.telefone || null,
      sexo: form.sexo || null,
      endereco: form.endereco || null,
      quarto: form.quarto?.trim() ? form.quarto.trim() : null,
      alta: form.alta,
      dataAlta: form.alta && form.dataAlta.trim() ? dataParaIso(form.dataAlta) : null,
      tipoAlta: form.alta && form.tipoAlta ? form.tipoAlta : null,
      motivoAdesaoId: form.motivoAdesaoId ? Number(form.motivoAdesaoId) : null,
      motivoDesistenciaId:
        form.alta && form.tipoAlta === 'DESISTENCIA' && form.motivoDesistenciaId
          ? Number(form.motivoDesistenciaId)
          : null,
      prescricoes: medicamentosSelecionadosIds.map((medicamentoId) => {
        const dose = doseDoMedicamento(medicamentoId);
        return {
          medicamentoId,
          doseManha: permitirDosesECombinados ? dose.manha : 0,
          doseTarde: permitirDosesECombinados ? dose.tarde : 0,
          doseNoite: permitirDosesECombinados ? dose.noite : 0,
        };
      }),
    };

    // No cadastro direto no histórico, o acolhido já entra arquivado.
    // Em edição, o campo é omitido para preservar o estado atual.
    if (!editando && modoHistorico) {
      payload.arquivado = true;
    }

    const foto = { file: fotoArquivo, remover: fotoRemovida };
    const combinados = permitirDosesECombinados ? combinadosPendentes : [];
    const salvo = await onSalvar(payload, anexosPendentes, foto, combinados);

    // ao cadastrar com sucesso, limpa o formulário, anexos pendentes e foto
    if (salvo && !editando) {
      limparAnexosPendentes();
      limparFoto();
      setForm(modoHistorico ? { ...FORM_INICIAL, alta: true } : FORM_INICIAL);
      setMedicamentosSelecionadosIds([]);
      setDosesPorMedicamento({});
      setCombinadosPendentes([]);
    }
  };

  // A seção de alta aparece na edição e também no cadastro direto no histórico
  // (pessoas que já passaram pela comunidade normalmente têm uma alta registrada).
  const mostrarAlta = editando || modoHistorico;

  const abas = useMemo(
    () => [
      { id: 'gerais', rotulo: 'Informações gerais' },
      { id: 'medicacoes', rotulo: 'Medicações' },
      { id: 'combinados', rotulo: 'Combinados' },
      { id: 'anexos', rotulo: 'Anexos' },
    ],
    []
  );

  // Mantém a aba ativa sempre entre as disponíveis para o contexto atual.
  useEffect(() => {
    if (!abas.some((a) => a.id === abaAtiva)) setAbaAtiva('gerais');
  }, [abas, abaAtiva]);

  const tituloForm = editando
    ? modoHistorico
      ? 'Editar acolhido do histórico'
      : 'Editar acolhido'
    : modoHistorico
      ? 'Cadastrar'
      : 'Novo acolhido';

  const tipoAltaSelecionado = TIPOS_ALTA.find((t) => t.valor === form.tipoAlta);

  const fotoExibida =
    fotoPreview || (editando && !fotoRemovida ? acolhidoEditando?.fotoUrl ?? '' : '');

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-cabecalho">
        <h2>{tituloForm}</h2>
        <div className="form-cabecalho-acoes">
          {!editando && !modoHistorico && (
            <button
              type="button"
              className="btn btn-secundario"
              onClick={preencherCadastroTeste}
            >
              Preencher cadastro
            </button>
          )}
          <button
            type="button"
            className="btn btn-secundario btn-novo"
            onClick={onVerLista}
            title="Ver lista de acolhidos"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Ver lista
          </button>
        </div>
      </div>

      <div className="form-abas" role="tablist" aria-label="Seções do cadastro">
        {abas.map((aba) => (
          <button
            key={aba.id}
            type="button"
            role="tab"
            aria-selected={abaAtiva === aba.id}
            className={`form-aba-btn ${abaAtiva === aba.id ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === 'gerais' && (
      <div className="grid">
        <div className="campo campo-largo">
          <label>Foto do acolhido</label>
          <div className="foto-upload">
            <div className="foto-miniatura">
              {fotoExibida ? (
                <img src={fotoExibida} alt="Foto do acolhido" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="foto-upload-acoes">
              <InputArquivoCustomizado
                id="acolhido-foto"
                inputRef={fotoInputRef}
                accept={FOTO_ACCEPT}
                onChange={handleSelecionarFoto}
                nomeArquivoSelecionado={fotoArquivo?.name ?? ''}
                textoBotao={fotoExibida ? 'Trocar foto' : 'Selecionar foto'}
                textoVazio="Nenhuma foto selecionada"
              />
              {fotoExibida && (
                <button
                  type="button"
                  className="btn btn-secundario btn-perigo-texto"
                  onClick={handleRemoverFoto}
                >
                  Remover foto
                </button>
              )}
              <span className="campo-ajuda">
                Imagem JPG, PNG ou WEBP, até 10 MB.
              </span>
              {erros.foto && <span className="erro">{erros.foto}</span>}
            </div>
          </div>
        </div>

        <div className="campo">
          <label htmlFor="nome">Nome *</label>
          <input
            id="nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome completo"
          />
          {erros.nome && <span className="erro">{erros.nome}</span>}
        </div>

        <div className="campo">
          <label htmlFor="cpf">CPF *</label>
          <input
            id="cpf"
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
          />
          {erros.cpf && <span className="erro">{erros.cpf}</span>}
        </div>

        <div className="campo">
          <label htmlFor="dataNascimento">Data de nascimento *</label>
          <input
            id="dataNascimento"
            name="dataNascimento"
            value={form.dataNascimento}
            onChange={handleChange}
            placeholder="dd/mm/aaaa"
            inputMode="numeric"
            maxLength={10}
          />
          {erros.dataNascimento && <span className="erro">{erros.dataNascimento}</span>}
        </div>

        <div className="campo">
          <label htmlFor="dataAcolhimentoCtav" title="Data em que o acolhido entra na instituição">
            Data de acolhimento na CTAV *
          </label>
          <input
            id="dataAcolhimentoCtav"
            name="dataAcolhimentoCtav"
            value={form.dataAcolhimentoCtav}
            onChange={handleChange}
            placeholder="dd/mm/aaaa"
            inputMode="numeric"
            maxLength={10}
          />
          {erros.dataAcolhimentoCtav && (
            <span className="erro">{erros.dataAcolhimentoCtav}</span>
          )}
        </div>

        <div className="campo">
          <label htmlFor="sexo">Sexo</label>
          <select id="sexo" name="sexo" value={form.sexo} onChange={handleChange}>
            <option value="">Selecione...</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>

        <div className="campo">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="acolhido@email.com"
          />
        </div>

        <div className="campo">
          <label htmlFor="telefone">Celular</label>
          <input
            id="telefone"
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
            maxLength={15}
          />
          {erros.telefone && <span className="erro">{erros.telefone}</span>}
        </div>

        <div className="campo">
          <label htmlFor="quarto">Quarto</label>
          <input
            id="quarto"
            name="quarto"
            value={form.quarto}
            onChange={handleChange}
            placeholder="Ex.: 101"
            maxLength={20}
          />
          {erros.quarto && <span className="erro">{erros.quarto}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="endereco">Endereço</label>
          <input
            id="endereco"
            name="endereco"
            value={form.endereco}
            onChange={handleChange}
            placeholder="Rua, número, bairro, cidade"
          />
        </div>

        <div className="campo campo-largo">
          <label htmlFor="motivoAdesaoId">Motivo de adesão *</label>
          <select
            id="motivoAdesaoId"
            name="motivoAdesaoId"
            value={form.motivoAdesaoId}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            {motivosAdesao.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          {erros.motivoAdesaoId && (
            <span className="erro">{erros.motivoAdesaoId}</span>
          )}
          <span className="campo-ajuda">
            Por que o acolhido entrou na comunidade. Gerencie as opções no menu
            &quot;Motivos&quot;.
          </span>
        </div>

        {mostrarAlta && (
          <div className="campo campo-largo">
            <label className="campo-check">
              <input
                type="checkbox"
                name="alta"
                checked={form.alta}
                onChange={handleChange}
                disabled={modoHistorico}
              />
              <span>Alta</span>
            </label>
            <span className="campo-ajuda">
              {modoHistorico
                ? 'No histórico a alta é obrigatória. Informe abaixo a data e o tipo da alta.'
                : 'Marque se o acolhido recebeu alta e informe a data correspondente.'}
            </span>
          </div>
        )}

        {mostrarAlta && form.alta && (
          <div className="campo">
            <label htmlFor="dataAlta">Data da alta *</label>
            <input
              id="dataAlta"
              name="dataAlta"
              value={form.dataAlta}
              onChange={handleChange}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              maxLength={10}
            />
            {erros.dataAlta && <span className="erro">{erros.dataAlta}</span>}
          </div>
        )}

        {mostrarAlta && form.alta && (
          <div className="campo">
            <label htmlFor="tipoAlta">Tipo de alta *</label>
            <select
              id="tipoAlta"
              name="tipoAlta"
              value={form.tipoAlta}
              onChange={handleChange}
            >
              <option value="">Selecione...</option>
              {TIPOS_ALTA.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>
            {erros.tipoAlta && <span className="erro">{erros.tipoAlta}</span>}
            {tipoAltaSelecionado && (
              <span className="campo-ajuda">{tipoAltaSelecionado.descricao}</span>
            )}
          </div>
        )}

        {mostrarAlta && form.alta && form.tipoAlta === 'DESISTENCIA' && (
          <div className="campo">
            <label htmlFor="motivoDesistenciaId">Motivo da desistência *</label>
            <select
              id="motivoDesistenciaId"
              name="motivoDesistenciaId"
              value={form.motivoDesistenciaId}
              onChange={handleChange}
            >
              <option value="">Selecione...</option>
              {motivosDesistencia.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
            {erros.motivoDesistenciaId && (
              <span className="erro">{erros.motivoDesistenciaId}</span>
            )}
            <span className="campo-ajuda">
              Por que o acolhido interrompeu o tratamento.
            </span>
          </div>
        )}
      </div>
      )}

      {abaAtiva === 'medicacoes' && (
      <div className="grid">
        <div className="campo campo-largo">
          <label>Medicamentos prescritos</label>
          <div className="dual-list">
            <div className="dual-list-coluna">
              <span className="dual-list-titulo">Medicamentos disponíveis</span>
              <ul className="dual-list-caixa" role="listbox">
                {medicamentosNaoSelecionados.length === 0 ? (
                  <li className="dual-list-vazio">
                    {medicamentosDisponiveis.length === 0
                      ? 'Nenhum medicamento cadastrado.'
                      : 'Todos já foram incluídos.'}
                  </li>
                ) : (
                  medicamentosNaoSelecionados.map((m) => (
                    <li
                      key={m.id}
                      role="option"
                      aria-selected={destaqueDisponivel === m.id}
                      className={`dual-list-item ${
                        destaqueDisponivel === m.id ? 'destaque' : ''
                      }`}
                      onClick={() => setDestaqueDisponivel(m.id)}
                      onDoubleClick={() => incluirMedicamento(m.id)}
                    >
                      <span className="dual-list-item-titulo">{m.nome}</span>
                      {m.descricao ? (
                        <span className="dual-list-item-sub" title={m.descricao}>
                          {truncarDescricao(m.descricao)}
                        </span>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="dual-list-acoes">
              <button
                type="button"
                className="btn btn-secundario btn-seta btn-seta-dupla"
                onClick={incluirTodosMedicamentos}
                disabled={medicamentosNaoSelecionados.length === 0}
                aria-label="Incluir todos os medicamentos"
                title="Incluir todos"
              >
                &gt;&gt;
              </button>
              <button
                type="button"
                className="btn btn-secundario btn-seta"
                onClick={() => incluirMedicamento(destaqueDisponivel)}
                disabled={destaqueDisponivel == null}
                aria-label="Incluir medicamento selecionado"
                title="Incluir"
              >
                &gt;
              </button>
              <button
                type="button"
                className="btn btn-secundario btn-seta"
                onClick={() => removerMedicamento(destaqueSelecionado)}
                disabled={destaqueSelecionado == null}
                aria-label="Remover medicamento selecionado"
                title="Remover"
              >
                &lt;
              </button>
              <button
                type="button"
                className="btn btn-secundario btn-seta btn-seta-dupla"
                onClick={removerTodosMedicamentos}
                disabled={medicamentosSelecionados.length === 0}
                aria-label="Remover todos os medicamentos"
                title="Remover todos"
              >
                &lt;&lt;
              </button>
            </div>

            <div className="dual-list-coluna">
              <span className="dual-list-titulo">Medicamentos inclusos</span>
              <ul className="dual-list-caixa" role="listbox">
                {medicamentosSelecionados.length === 0 ? (
                  <li className="dual-list-vazio">Nenhum medicamento incluído.</li>
                ) : (
                  medicamentosSelecionados.map((m) => (
                    <li
                      key={m.id}
                      role="option"
                      aria-selected={destaqueSelecionado === m.id}
                      className={`dual-list-item ${
                        destaqueSelecionado === m.id ? 'destaque' : ''
                      }`}
                      onClick={() => setDestaqueSelecionado(m.id)}
                      onDoubleClick={() => removerMedicamento(m.id)}
                    >
                      <span className="dual-list-item-titulo">{m.nome}</span>
                      {m.descricao ? (
                        <span className="dual-list-item-sub" title={m.descricao}>
                          {truncarDescricao(m.descricao)}
                        </span>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <span className="campo-ajuda">
            {permitirDosesECombinados
              ? 'Selecione os medicamentos e informe abaixo as doses por período.'
              : 'As doses por período são definidas no Controle de administração, em Medicamentos.'}
          </span>
        </div>

        {permitirDosesECombinados && medicamentosSelecionados.length > 0 && (
          <div className="campo campo-largo">
            <label>Doses por período</label>
            <div className="tabela-wrapper doses-tabela-wrapper">
              <table className="tabela doses-tabela">
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Manhã</th>
                    <th>Tarde</th>
                    <th>Noite</th>
                  </tr>
                </thead>
                <tbody>
                  {medicamentosSelecionados.map((m) => {
                    const dose = doseDoMedicamento(m.id);
                    return (
                      <tr key={m.id}>
                        <td>{m.nome}</td>
                        {['manha', 'tarde', 'noite'].map((periodo) => (
                          <td key={periodo}>
                            <input
                              type="number"
                              min="0"
                              className="dose-input"
                              value={dose[periodo]}
                              onChange={(e) => atualizarDose(m.id, periodo, e.target.value)}
                              aria-label={`${m.nome} - ${periodo}`}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <span className="campo-ajuda">
              Quantidade de comprimidos por período (0 quando não toma naquele período).
            </span>
          </div>
        )}
      </div>
      )}

      {abaAtiva === 'combinados' && (
      <div className="grid">
        <div className="campo campo-largo">
          <label>Combinados (opcional)</label>
            <div className="anexo-upload">
              <div className="anexo-upload-campos anexo-upload-campos-vertical">
                <div className="campo">
                  <label htmlFor="hist-combinado-tipo">Tipo</label>
                  <select
                    id="hist-combinado-tipo"
                    value={combinadoTipo}
                    onChange={(e) => setCombinadoTipo(e.target.value)}
                  >
                    <option value="">Selecione o tipo...</option>
                    {TIPOS_COMBINADO.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.rotulo}
                      </option>
                    ))}
                  </select>
                  {erros.combinadoTipo && <span className="erro">{erros.combinadoTipo}</span>}
                </div>
                {ehRessocializacaoCombinado ? (
                  <div className="campo combinado-datas-linha">
                    <div className="campo">
                      <label htmlFor="hist-combinado-ida">Data de ida</label>
                      <input
                        id="hist-combinado-ida"
                        value={combinadoDataIda}
                        onChange={(e) => setCombinadoDataIda(maskData(e.target.value))}
                        placeholder="dd/mm/aaaa"
                        inputMode="numeric"
                        maxLength={10}
                      />
                      {erros.combinadoDataIda && (
                        <span className="erro">{erros.combinadoDataIda}</span>
                      )}
                    </div>
                    <div className="campo">
                      <label htmlFor="hist-combinado-volta">Data de volta</label>
                      <input
                        id="hist-combinado-volta"
                        value={combinadoDataVolta}
                        onChange={(e) => setCombinadoDataVolta(maskData(e.target.value))}
                        placeholder="dd/mm/aaaa"
                        inputMode="numeric"
                        maxLength={10}
                      />
                      {erros.combinadoDataVolta && (
                        <span className="erro">{erros.combinadoDataVolta}</span>
                      )}
                    </div>
                  </div>
                ) : combinadoTipo ? (
                  <div className="campo">
                    <label htmlFor="hist-combinado-data">Data do combinado *</label>
                    <input
                      id="hist-combinado-data"
                      value={combinadoData}
                      onChange={(e) => setCombinadoData(maskData(e.target.value))}
                      placeholder="dd/mm/aaaa"
                      inputMode="numeric"
                      maxLength={10}
                    />
                    {erros.combinadoData && (
                      <span className="erro">{erros.combinadoData}</span>
                    )}
                  </div>
                ) : null}
                <div className="campo campo-largo">
                  <label htmlFor="hist-combinado-descricao">Descrição</label>
                  <textarea
                    id="hist-combinado-descricao"
                    value={combinadoDescricao}
                    onChange={(e) => setCombinadoDescricao(e.target.value)}
                    placeholder="Detalhes do combinado (motivo, local, observações)"
                    rows={3}
                    maxLength={1000}
                  />
                  {erros.combinadoDescricao && (
                    <span className="erro">{erros.combinadoDescricao}</span>
                  )}
                </div>
              </div>
              <div className="anexo-upload-acoes">
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={adicionarCombinado}
                >
                  Adicionar à lista
                </button>
              </div>
            </div>

            {combinadosPendentes.length > 0 && (
              <ul className="combinados-pendentes">
                {combinadosPendentes.map((c) => {
                  const rotulo =
                    TIPOS_COMBINADO.find((t) => t.valor === c.tipo)?.rotulo ?? c.tipo;
                  return (
                    <li key={c.localId} className="combinado-pendente">
                      <div className="combinado-pendente-info">
                        <span className="combinado-pendente-tipo">{rotulo}</span>
                        {c.dataIda ? (
                          <span className="combinado-pendente-datas">
                            {`Ida ${isoParaData(c.dataIda)} · Volta ${isoParaData(c.dataVolta)}`}
                          </span>
                        ) : c.dataCombinado ? (
                          <span className="combinado-pendente-datas">
                            {`Data ${isoParaData(c.dataCombinado)}`}
                          </span>
                        ) : null}
                        <span className="combinado-pendente-descricao">{c.descricao}</span>
                      </div>
                      <button
                        type="button"
                        className="anexo-thumb-remover"
                        onClick={() => removerCombinadoPendente(c.localId)}
                        aria-label="Remover combinado"
                        title="Remover"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <span className="campo-ajuda">
              {editando
                ? 'Os novos combinados são criados ao salvar. Os já existentes ficam na página Combinados.'
                : 'Os combinados são criados e vinculados ao acolhido após o cadastro.'}
            </span>
          </div>
      </div>
      )}

      {abaAtiva === 'anexos' && (
      <div className="grid">
        <div className="campo campo-largo">
          <label>Anexos (opcional)</label>
            <div className="anexo-upload">
              <div className="anexo-upload-campos anexo-upload-campos-com-nome">
                <div className="campo">
                  <label htmlFor="cadastro-anexo-nome">Nome</label>
                  <input
                    id="cadastro-anexo-nome"
                    type="text"
                    value={anexoNome}
                    onChange={(e) => setAnexoNome(e.target.value)}
                    placeholder="Nome do anexo"
                    maxLength={120}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="cadastro-anexo-tipo">Tipo</label>
                  <select
                    id="cadastro-anexo-tipo"
                    value={anexoTipo}
                    onChange={(e) => setAnexoTipo(e.target.value)}
                  >
                    {TIPOS_ANEXO.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="cadastro-anexo-arquivo">
                    Arquivo (PDF, JPG, PNG ou Excel .xlsx — máx. 10 MB)
                  </label>
                  <InputArquivoCustomizado
                    id="cadastro-anexo-arquivo"
                    inputRef={anexoInputRef}
                    accept={ANEXO_ACCEPT}
                    onChange={handleSelecionarAnexo}
                    nomeArquivoSelecionado={anexoArquivo?.name ?? ''}
                  />
                </div>
              </div>
              <div className="anexo-upload-acoes">
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={handleAdicionarAnexoLista}
                >
                  Adicionar à lista
                </button>
              </div>
            </div>
            {erros.anexo && <span className="erro">{erros.anexo}</span>}
            <span className="campo-ajuda">
              {editando
                ? 'Os novos anexos são enviados ao salvar. Para ver ou gerenciar os anexos já existentes, use "Anexos" na lista de acolhidos.'
                : 'Os anexos são enviados após o cadastro do acolhido.'}
            </span>

            {anexosPendentes.length > 0 && (
              <ul className="anexos-thumbs">
                {anexosPendentes.map((a) => (
                  <li key={a.localId} className="anexo-thumb">
                    <div className="anexo-thumb-preview">
                      {a.ehImagem && a.previewUrl ? (
                        <img src={a.previewUrl} alt={a.nomeArquivo} />
                      ) : (
                        <span className="anexo-thumb-ext">
                          {(a.file.name.split('.').pop() || 'arq').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="anexo-thumb-info">
                      <input
                        type="text"
                        className="anexo-thumb-nome-input"
                        value={a.nomeArquivo}
                        onChange={(e) =>
                          setAnexosPendentes((atual) =>
                            atual.map((x) =>
                              x.localId === a.localId
                                ? { ...x, nomeArquivo: e.target.value }
                                : x
                            )
                          )
                        }
                        maxLength={120}
                        aria-label="Nome do anexo"
                      />
                      <span className="anexo-tag">{rotuloTipoAnexo(a.tipo)}</span>
                    </div>
                    <button
                      type="button"
                      className="anexo-thumb-remover"
                      onClick={() => removerAnexoPendente(a.localId)}
                      aria-label="Remover anexo"
                      title="Remover"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
      </div>
      )}

      <div className="acoes">
        <button type="submit" className="btn btn-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Cadastrar'}
        </button>
        {editando && (
          <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
