import { useState, useEffect, useCallback } from 'react';
import { Workbook, } from '@fortune-sheet/react';
import { api as FortuneSheetApi } from "@fortune-sheet/core";

import "@fortune-sheet/react/dist/index.css";

const App = () => {
  const [data, setData] = useState([{ name: "Sheet1", celldata: [] }]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentNote = await api.getActiveContextNote();

      if (!currentNote) {
        console.error("Note not found");
        return;
      }

      const childrenNotes = await currentNote.getChildNotes();
      let dataNote = childrenNotes.find(n => n.title === 'data.json' && !n.isDeleted);

      if (!dataNote) {
        await api.runOnBackend(({ currentNoteId, content }) => {
          const { note } = api.createNewNote({
            parentNoteId: currentNoteId,
            title: 'data.json',
            type: 'code',
            mime: 'application/json',
            content,
          });
          api.log(`Created data note ${note.noteId()}`);
          return note;
        }, [{ currentNoteId: currentNote.noteId, content }]);
        return;
      }

      const jsonContent = await dataNote.getJsonContent();
      if (jsonContent) {
        if (!Array.isArray(jsonContent)) {
          setData([{ name: "Sheet1", celldata: [] }]);
        } else {
          setData(jsonContent.map((sheet) => ({
            ...sheet,
            celldata: FortuneSheetApi.dataToCelldata(sheet.data || []),
            data: undefined,
          })));
        }
      }
    } catch (err) {
      console.error("Failed to load spreadsheet data", err);
    } finally {
      // short delay to ensure Fortune Sheet wont call save default data before loading data
      setTimeout(() => setIsLoaded(true), 100);
    }
  }, []);

  const saveData = useCallback(async (newData) => {
    if (!isLoaded) {
      return;
    }

    try {
      const content = JSON.stringify(newData);
      const currentNote = await api.getActiveContextNote();
      if (!currentNote) {
        console.error("Note not found");
        return;
      }

      const childNotes = await currentNote.getChildNotes();
      let dataNote = childNotes.find((n) => n.title === 'data.json' && !n.isDeleted);

      if (!dataNote) {
        const note = await api.runOnBackend(({ currentNoteId, content }) => {
          const { note } = api.createNewNote({
            parentNoteId: currentNoteId,
            title: 'data.json',
            type: 'code',
            mime: 'application/json',
            content,
          });
          api.log(`Created data note ${note.noteId()}`);
          return note;
        }, [{ currentNoteId: currentNote.noteId, content }]);
        api.refreshIncludedNote(note.noteId);
      } else {
        await api.runOnBackend(({ dataNoteId, content }) => {
          const dNote = api.getNote(dataNoteId);
          dNote.setContent(content, { forceFrontendReload: true, forceSave: true });
        }, [{ dataNoteId: dataNote.noteId, content }]);

        api.refreshIncludedNote(dataNote.noteId);
      }
    } catch (err) {
      console.error("Failed to save spreadsheet data", err);
    }
  }, [isLoaded]);

  const onDataChange = useCallback((d) => {
    if (!isLoaded) return;
    saveData(d);
  }, [isLoaded, saveData]);

  useEffect(() => {
    if (!isLoaded) {
      loadData();

      // Force resize event to ensure Fortune Sheet calculates dimensions correctly
      const forceResize = () => window.dispatchEvent(new Event('resize'));

      // Trigger immediately and after a short delay to catch layout settles
      const [t1, t2] = [setTimeout(forceResize, 100), setTimeout(forceResize, 500)];

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isLoaded]);

  if (!api) {
    return <div>API not found. Make sure note type is Trillium renderNote.</div>;
  } else if (!isLoaded) {
    return <div>Loading spreadsheet data...</div>;
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: 'calc(70vh - 100px)', /* Force visible height */
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <Workbook data={data} onChange={onDataChange} />
    </div>
  );
};

export default App;
