import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

admin.initializeApp();

export const sendNotificationOnNew = onDocumentCreated(
  "notifications/{notifId}",
  async (event) => {
    const data = event.data?.data() as any;
    if (!data) return;

    let titulo: string;
    let mensagem: string;

    switch (data.tipo) {
      case "inicio_rota":
        titulo = "Uma rota foi iniciada!";
        mensagem = "O ônibus escolar acabou de sair do IF! Alunos, fiquem atentos à localização no mapa";
        break;
      case "fim_rota":
        titulo = "Uma rota foi finalizada!";
        mensagem =
          "O ônibus escolar chegou ao IF! Alunos, fiquem atentos aos seus pertences para não esquecer objetos no ônibus.";
        break;
      case "imprevisto":
        titulo = "Imprevistos acontecem...";
        mensagem = "Atenção! Por algum motivo o ônibus não conseguiu completar a rota.";
        break;
      case "noroute":
        titulo = "Sem rota por hoje!";
        mensagem = "Hoje o ônibus do IF não poderá fazer a rota...";
        break;
      default:
        titulo = "Aviso do sistema";
        mensagem = "Aviso do sistema...";
        break;
    }

    const snapshot = await admin.firestore().collection("userTokens").get();
    const tokens = Array.from(
      new Set(
        snapshot.docs
          .map((doc) => doc.data().token as string)
          .filter((t) => !!t)
      )
    );

    if (tokens.length === 0) {
      console.log("Nenhum token encontrado no Firestore.");
      return;
    }

    const batchSize = 500;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize);

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: titulo,
          body: mensagem,
        },
        tokens: batchTokens,
        data: { tipo: data.tipo ?? "info" },
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(
          `Batch ${i / batchSize + 1}: ${response.successCount} sucesso(s), ${response.failureCount} falha(s)`
        );

        const invalidTokens: string[] = [];
        response.responses.forEach((res, idx) => {
          if (!res.success) {
            const err = res.error;
            if (
              err?.code === "messaging/invalid-argument" ||
              err?.code === "messaging/registration-token-not-registered"
            ) {
              invalidTokens.push(batchTokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          const batch = admin.firestore().batch();
          snapshot.docs.forEach((doc) => {
            if (invalidTokens.includes(doc.data().token)) {
              batch.delete(doc.ref);
            }
          });
          await batch.commit();
          console.log("Tokens inválidos removidos do Firestore:", invalidTokens);
        }
      } catch (error) {
        console.error("Erro ao enviar batch:", error);
      }
    }
  }
);



