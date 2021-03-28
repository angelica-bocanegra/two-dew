// @flow
import * as React from 'react';

import { useFirebase } from '@pkgs/utils';

import Layout from './Layout';
import Options from './Options';

export type LayoutT = Array<{
  data: Array<string>,
}>;

const Main = (): React.Node => {
  const { auth, firestore } = useFirebase();
  const user = auth().currentUser;

  const [lists, setLists] = React.useState([]);
  const [renderedLists, setRenderedLists] = React.useState<LayoutT | void>();

  const handleAddNewListItem = (list) => {
    setLists((pLists) => [
      ...pLists,
      list,
    ]);
  };

  React.useEffect(() => {
    if (user) {
      // Get all lists belonging to owner
      firestore().collection('lists').where('owner', '==', user.uid).get()
        .then((snapshot) => {
          snapshot.forEach((doc) => {
            handleAddNewListItem({
              ...doc.data(),
              id: doc.id,
            });
          });
        })
        .catch((err) => {
          console.error(err);
        });

      // Get user preference data
      firestore().collection('users').doc(user.uid).get()
        .then((snapshot) => {
          const data = snapshot.data();
          if (!data) {
            const initialLayout = [
              {
                data: [''],
              },
            ];
            firestore().collection('users').doc(user.uid).set({
              layout: initialLayout,
            })
              .then(() => {
                setRenderedLists(initialLayout);
              })
              .catch((err) => {
                console.error(err);
              });
          } else {
            setRenderedLists(data.layout);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, []);

  React.useEffect(() => {
    if (user && renderedLists) {
      firestore().collection('users').doc(user.uid).update({
        layout: renderedLists,
      });
    }
  }, [user, renderedLists]);

  return (
    <>
      <Options
        handleAddNewListItem={handleAddNewListItem}
      />
      {renderedLists && (
        <Layout
          lists={lists}
          renderedLists={renderedLists}
          // $FlowExpectedError[incompatible-type]
          setRenderedLists={setRenderedLists}
        />
      )}
    </>
  );
};

export default Main;
