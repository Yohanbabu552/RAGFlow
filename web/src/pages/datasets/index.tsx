import { CardContainer } from '@/components/card-container';
import { EmptyCardType } from '@/components/empty/constant';
import { EmptyAppCard } from '@/components/empty/empty';
import ListFilterBar from '@/components/list-filter-bar';
import { RenameDialog } from '@/components/rename-dialog';
import { Button } from '@/components/ui/button';
import { RAGFlowPagination } from '@/components/ui/ragflow-pagination';
import { useFetchNextKnowledgeListByPage } from '@/hooks/use-knowledge-request';
import { useFetchUserInfo } from '@/hooks/use-user-setting-request';
import { getEffectiveRole, isSuperAdmin } from '@/utils/rbac-util';
import { useQueryClient } from '@tanstack/react-query';
import { pick } from 'lodash';
import { FolderKanban, Plus, Shield } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { DatasetCard } from './dataset-card';
import { DatasetCreatingDialog } from './dataset-creating-dialog';
import { useSaveKnowledge } from './hooks';
import { useRenameDataset } from './use-rename-dataset';
import { useSelectOwners } from './use-select-owners';

export default function Datasets() {
  const { t } = useTranslation();
  const { data: userInfo } = useFetchUserInfo();
  const isAdmin = isSuperAdmin(userInfo);
  const effectiveRole = getEffectiveRole(userInfo);

  // Project filter state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const {
    visible,
    hideModal,
    showModal,
    onCreateOk,
    loading: creatingLoading,
  } = useSaveKnowledge();

  const {
    kbs,
    total,
    pagination,
    setPagination,
    handleInputChange,
    searchString,
    filterValue,
    handleFilterSubmit,
  } = useFetchNextKnowledgeListByPage();

  const owners = useSelectOwners();

  const {
    datasetRenameLoading,
    initialDatasetName,
    onDatasetRenameOk,
    datasetRenameVisible,
    hideDatasetRenameModal,
    showDatasetRenameModal,
  } = useRenameDataset();

  const handlePageChange = useCallback(
    (page: number, pageSize?: number) => {
      setPagination({ page, pageSize });
    },
    [setPagination],
  );
  const [searchUrl, setSearchUrl] = useSearchParams();
  const isCreate = searchUrl.get('isCreate') === 'true';
  const queryClient = useQueryClient();
  useEffect(() => {
    if (isCreate) {
      queryClient.invalidateQueries({ queryKey: ['tenantInfo'] });
      showModal();
      searchUrl.delete('isCreate');
      setSearchUrl(searchUrl);
    }
  }, [isCreate, showModal, searchUrl, setSearchUrl]);

  // Get project list for filter dropdown
  const projectRoles = userInfo?.project_roles || [];

  // Determine if create button should be visible (admin or project admin can create)
  const canCreateDataset =
    isAdmin || effectiveRole === 'project_admin' || effectiveRole === 'member';

  return (
    <>
      <section className="py-4 flex-1 flex flex-col">
        {/* Project scope filter bar */}
        {projectRoles.length > 0 && (
          <div className="px-8 mb-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FolderKanban className="size-4" />
              <span>Project:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedProjectId('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedProjectId === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All Projects
              </button>
              {projectRoles.map((pr) => (
                <button
                  key={pr.project_id}
                  onClick={() => setSelectedProjectId(pr.project_id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                    selectedProjectId === pr.project_id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {pr.role === 'admin' && (
                    <Shield className="size-3" />
                  )}
                  {pr.project_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {(!kbs?.length || kbs?.length <= 0) && !searchString && (
          <div className="flex w-full items-center justify-center h-[calc(100vh-164px)]">
            <EmptyAppCard
              showIcon
              size="large"
              className="w-[480px] p-14"
              isSearch={!!searchString}
              type={EmptyCardType.Dataset}
              onClick={() => showModal()}
            />
          </div>
        )}
        {(!!kbs?.length || searchString) && (
          <>
            <ListFilterBar
              title={t('header.dataset')}
              searchString={searchString}
              onSearchChange={handleInputChange}
              value={filterValue}
              filters={owners}
              onChange={handleFilterSubmit}
              className="px-8"
              icon={'datasets'}
            >
              {canCreateDataset && (
                <Button onClick={showModal}>
                  <Plus className="h-4 w-4" />
                  {t('knowledgeList.createKnowledgeBase')}
                </Button>
              )}
            </ListFilterBar>
            {(!kbs?.length || kbs?.length <= 0) && searchString && (
              <div className="flex w-full items-center justify-center h-[calc(100vh-164px)]">
                <EmptyAppCard
                  showIcon
                  size="large"
                  className="w-[480px] p-14"
                  isSearch={!!searchString}
                  type={EmptyCardType.Dataset}
                  onClick={() => showModal()}
                />
              </div>
            )}
            <div className="flex-1">
              <CardContainer className="max-h-[calc(100dvh-280px)] overflow-auto px-8">
                {kbs.map((dataset) => {
                  return (
                    <DatasetCard
                      dataset={dataset}
                      key={dataset.id}
                      showDatasetRenameModal={showDatasetRenameModal}
                    ></DatasetCard>
                  );
                })}
              </CardContainer>
            </div>
            <div className="mt-8 px-8">
              <RAGFlowPagination
                {...pick(pagination, 'current', 'pageSize')}
                total={total}
                onChange={handlePageChange}
              ></RAGFlowPagination>
            </div>
          </>
        )}
        {visible && (
          <DatasetCreatingDialog
            hideModal={hideModal}
            onOk={onCreateOk}
            loading={creatingLoading}
          ></DatasetCreatingDialog>
        )}
        {datasetRenameVisible && (
          <RenameDialog
            hideModal={hideDatasetRenameModal}
            onOk={onDatasetRenameOk}
            initialName={initialDatasetName}
            loading={datasetRenameLoading}
          ></RenameDialog>
        )}
      </section>
    </>
  );
}
